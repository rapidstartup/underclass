#!/usr/bin/env node
import crypto from "crypto";
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const batchSize = Number(process.env.SESSIONS_MIGRATION_BATCH_SIZE || "250");
const sampleCount = Number(process.env.SESSIONS_MIGRATION_SAMPLE_COUNT || "20");

const sourceDbUrl = process.env.SOURCE_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL;
const supabaseUrl =
  process.env.TARGET_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;
const supabaseServiceKey =
  process.env.TARGET_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!sourceDbUrl) {
  console.error("Missing SOURCE_DATABASE_URL (or POSTGRES_URL / DATABASE_URL).");
  process.exit(1);
}
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing target Supabase URL/service role key.");
  process.exit(1);
}

const sourceDb = postgres(sourceDbUrl, { prepare: false });
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function toSha(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value ?? null)).digest("hex");
}

async function getCounts() {
  const sourceRows = await sourceDb`SELECT COUNT(*)::int AS count FROM public.sessions`;
  const sourceCount = sourceRows[0]?.count || 0;

  const { count: targetCount, error } = await supabase
    .from("sessions")
    .select("id", { count: "exact", head: true });
  if (error) throw new Error(`Target count failed: ${error.message}`);

  return { sourceCount, targetCount: targetCount || 0 };
}

async function migrateBatches() {
  let offset = 0;
  let processed = 0;

  while (true) {
    const rows = await sourceDb`
      SELECT
        id,
        linkedin_url,
        person_name,
        profile_data,
        messages,
        final_pul,
        created_at,
        updated_at
      FROM public.sessions
      ORDER BY created_at ASC, id ASC
      LIMIT ${batchSize}
      OFFSET ${offset}
    `;

    if (rows.length === 0) break;

    const payload = rows.map((row) => ({
      id: row.id,
      linkedin_url: row.linkedin_url,
      person_name: row.person_name,
      profile_data: row.profile_data ?? {},
      messages: row.messages ?? [],
      final_pul: row.final_pul ?? null,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
      updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    }));

    if (!dryRun) {
      const { error } = await supabase
        .from("sessions")
        .upsert(payload, { onConflict: "id" });
      if (error) throw new Error(`Upsert failed at offset ${offset}: ${error.message}`);
    }

    processed += rows.length;
    offset += rows.length;
    console.log(`[sessions-migration] processed ${processed} rows`);
  }
}

async function validateSamples() {
  const sampleRows = await sourceDb`
    SELECT id, messages
    FROM public.sessions
    ORDER BY RANDOM()
    LIMIT ${sampleCount}
  `;

  let mismatches = 0;
  for (const row of sampleRows) {
    const { data, error } = await supabase
      .from("sessions")
      .select("messages")
      .eq("id", row.id)
      .maybeSingle();
    if (error) throw new Error(`Sample lookup failed for ${row.id}: ${error.message}`);
    if (!data) {
      console.warn(`[sessions-migration] sample missing in target: ${row.id}`);
      mismatches++;
      continue;
    }
    if (toSha(row.messages) !== toSha(data.messages)) {
      console.warn(`[sessions-migration] payload mismatch: ${row.id}`);
      mismatches++;
    }
  }

  return { checked: sampleRows.length, mismatches };
}

async function verifySessionIds() {
  const idsRaw = process.env.SESSIONS_VERIFY_IDS || "";
  const ids = idsRaw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  if (ids.length === 0) return [];

  const results = [];
  for (const id of ids) {
    const { data, error } = await supabase
      .from("sessions")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    results.push({ id, exists: Boolean(data), error: error?.message || null });
  }
  return results;
}

async function main() {
  console.log(`[sessions-migration] mode=${dryRun ? "dry-run" : "write"} batch=${batchSize}`);
  const before = await getCounts();
  console.log(
    `[sessions-migration] before counts source=${before.sourceCount} target=${before.targetCount}`
  );

  await migrateBatches();

  const after = await getCounts();
  console.log(
    `[sessions-migration] after counts source=${after.sourceCount} target=${after.targetCount}`
  );

  const sample = await validateSamples();
  console.log(
    `[sessions-migration] sample validation checked=${sample.checked} mismatches=${sample.mismatches}`
  );

  const verified = await verifySessionIds();
  if (verified.length > 0) {
    console.log("[sessions-migration] explicit ID verification:");
    verified.forEach((item) => {
      console.log(`  - ${item.id}: ${item.exists ? "OK" : "MISSING"}${item.error ? ` (${item.error})` : ""}`);
    });
  }
}

main()
  .catch((error) => {
    console.error("[sessions-migration] failed:", error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sourceDb.end({ timeout: 5 });
  });
