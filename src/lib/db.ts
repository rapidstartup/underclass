import { getSupabaseAdminClient } from "@/lib/supabase-server";

type JsonObject = Record<string, unknown>;

function generateId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export interface SessionData {
  id: string;
  linkedinUrl: string;
  personName: string;
  profileData: Record<string, unknown>;
  messages: Record<string, unknown>[];
  finalPul?: number;
  createdAt: string;
  isPublic?: boolean;
  memberEmail?: string;
  memberId?: string;
  accessUnlockedAt?: string;
}

export interface SessionSummary {
  id: string;
  personName: string;
  finalPul: number | null;
  createdAt: string;
  isPublic?: boolean;
  memberEmail?: string;
  memberId?: string;
  accessUnlockedAt?: string;
}

type ProfileLookup =
  | { kind: "linkedin"; slug: string; normalized: string }
  | { kind: "x"; handle: string; normalized: string }
  | { kind: "raw"; normalized: string };

function parseProfileLookup(input: string): ProfileLookup {
  const trimmed = input.trim();
  if (!trimmed) return { kind: "raw", normalized: "" };

  const linkedinMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([^/?#\s]+)/i);
  if (linkedinMatch?.[1]) {
    const slug = linkedinMatch[1].replace(/^@/, "").toLowerCase();
    return {
      kind: "linkedin",
      slug,
      normalized: `https://www.linkedin.com/in/${slug}`,
    };
  }

  const xMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?(?:x|twitter)\.com\/([^/?#\s]+)/i);
  if (xMatch?.[1]) {
    const handle = xMatch[1].replace(/^@/, "").toLowerCase();
    return {
      kind: "x",
      handle,
      normalized: `https://x.com/${handle}`,
    };
  }

  if (/^@?[a-zA-Z0-9_]+$/.test(trimmed)) {
    const handle = trimmed.replace(/^@/, "").toLowerCase();
    return {
      kind: "x",
      handle,
      normalized: `https://x.com/${handle}`,
    };
  }

  return { kind: "raw", normalized: trimmed.replace(/\/+$/, "") };
}

export function normalizeProfileUrl(input: string): string {
  return parseProfileLookup(input).normalized;
}

function getDb() {
  return getSupabaseAdminClient();
}

// Validate database connectivity / schema presence.
export async function initDb() {
  const db = getDb();
  const { error } = await db
    .from("sessions")
    .select("id", { head: true, count: "exact" })
    .limit(1);

  if (error) {
    throw new Error(`Sessions table unavailable: ${error.message}`);
  }
}

export async function createSession(data: {
  linkedinUrl: string;
  personName: string;
  profileData: JsonObject;
  messages: JsonObject[];
  finalPul?: number;
  isPublic?: boolean;
  memberEmail?: string;
  memberId?: string;
  accessSource?: string;
}): Promise<string> {
  const db = getDb();
  const id = generateId();
  const normalizedProfileUrl = normalizeProfileUrl(data.linkedinUrl);

  const { error } = await db.from("sessions").insert({
    id,
    linkedin_url: normalizedProfileUrl,
    person_name: data.personName,
    profile_data: data.profileData || {},
    messages: data.messages || [],
    final_pul: data.finalPul ?? null,
    is_public: data.isPublic ?? true,
    member_email: data.memberEmail ?? null,
    member_id: data.memberId ?? null,
    access_unlocked_at: data.memberEmail || data.memberId ? new Date().toISOString() : null,
    access_source: data.accessSource ?? null,
  });

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }

  return id;
}

export async function getSession(id: string): Promise<SessionData | null> {
  const db = getDb();
  const { data, error } = await db
    .from("sessions")
    .select("id, linkedin_url, person_name, profile_data, messages, final_pul, created_at, is_public, member_email, member_id, access_unlocked_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load session: ${error.message}`);
  }
  if (!data) return null;

  const row = data as {
    id: string;
    linkedin_url: string;
    person_name: string | null;
    profile_data: JsonObject | null;
    messages: JsonObject[] | null;
    final_pul: number | null;
    created_at: string | null;
    is_public: boolean | null;
    member_email: string | null;
    member_id: string | null;
    access_unlocked_at: string | null;
  };

  return {
    id: row.id,
    linkedinUrl: row.linkedin_url,
    personName: row.person_name || "",
    profileData: row.profile_data || {},
    messages: row.messages || [],
    finalPul: row.final_pul ?? undefined,
    createdAt: row.created_at || new Date().toISOString(),
    isPublic: row.is_public ?? true,
    memberEmail: row.member_email || undefined,
    memberId: row.member_id || undefined,
    accessUnlockedAt: row.access_unlocked_at || undefined,
  };
}

// Get recent sessions for the landing page marquee
export async function getRecentSessions(limit = 20): Promise<Array<{
  id: string;
  personName: string;
  finalPul: number | null;
}>> {
  const db = getDb();
  const withVisibility = await db
    .from("sessions")
    .select("id, person_name, final_pul")
    .not("person_name", "is", null)
    .neq("person_name", "")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  let data = withVisibility.data;
  let error = withVisibility.error;

  // Migration-safe fallback if the new visibility column has not been applied yet.
  if (error && /is_public/i.test(error.message || "")) {
    const fallback = await db
      .from("sessions")
      .select("id, person_name, final_pul")
      .not("person_name", "is", null)
      .neq("person_name", "")
      .order("created_at", { ascending: false })
      .limit(limit);
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    throw new Error(`Failed to load recent sessions: ${error.message}`);
  }

  const rows = (data || []) as Array<{
    id: string;
    person_name: string | null;
    final_pul: number | null;
  }>;

  return rows.map((r) => ({
    id: r.id,
    personName: r.person_name || "",
    finalPul: r.final_pul,
  }));
}

export async function getSessionsByProfile(profile: string, limit = 5): Promise<SessionSummary[]> {
  const db = getDb();
  const parsed = parseProfileLookup(profile);
  if (!parsed.normalized) return [];

  let query = db
    .from("sessions")
    .select("id, person_name, final_pul, created_at, member_email, member_id, access_unlocked_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (parsed.kind === "linkedin") {
    query = query.ilike("linkedin_url", `%linkedin.com/in/${parsed.slug}%`);
  } else if (parsed.kind === "x") {
    query = query.or(`linkedin_url.ilike.%x.com/${parsed.handle}%,linkedin_url.ilike.%twitter.com/${parsed.handle}%`);
  } else {
    query = query.eq("linkedin_url", parsed.normalized);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load sessions by profile: ${error.message}`);
  }

  const rows = (data || []) as Array<{
    id: string;
    person_name: string | null;
    final_pul: number | null;
    created_at: string | null;
    member_email: string | null;
    member_id: string | null;
    access_unlocked_at: string | null;
  }>;

  return rows.map((r) => ({
    id: r.id,
    personName: r.person_name || "",
    finalPul: r.final_pul,
    createdAt: r.created_at || new Date().toISOString(),
    memberEmail: r.member_email || undefined,
    memberId: r.member_id || undefined,
    accessUnlockedAt: r.access_unlocked_at || undefined,
  }));
}

export async function updateSession(id: string, data: {
  messages: JsonObject[];
  finalPul?: number;
}): Promise<void> {
  const db = getDb();
  const { error } = await db
    .from("sessions")
    .update({
      messages: data.messages,
      final_pul: data.finalPul ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to update session: ${error.message}`);
  }
}

export async function captureSessionLead(data: {
  sessionId: string;
  leadName?: string;
  leadEmail?: string;
  upgradeIntent?: string;
}): Promise<void> {
  const db = getDb();
  const { error } = await db
    .from("sessions")
    .update({
      lead_name: data.leadName ?? null,
      lead_email: data.leadEmail ? data.leadEmail.toLowerCase() : null,
      upgrade_intent: data.upgradeIntent ?? null,
      upgrade_prompted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.sessionId);

  if (error) {
    throw new Error(`Failed to capture session lead: ${error.message}`);
  }
}

export async function upsertMemberUnlock(data: {
  unlockKey: string;
  memberId?: string;
  memberEmail?: string;
  memberName?: string;
  source: string;
  eventId?: string;
  payload?: JsonObject;
}): Promise<void> {
  const db = getDb();
  const nowIso = new Date().toISOString();

  const { error } = await db.from("member_unlocks").upsert(
    {
      unlock_key: data.unlockKey,
      member_id: data.memberId ?? null,
      member_email: data.memberEmail ? data.memberEmail.toLowerCase() : null,
      member_name: data.memberName ?? null,
      access_source: data.source,
      unlocked_at: nowIso,
      last_event_id: data.eventId ?? null,
      payload: data.payload ?? null,
      updated_at: nowIso,
    },
    { onConflict: "unlock_key" }
  );

  if (error) {
    throw new Error(`Failed to upsert member unlock: ${error.message}`);
  }
}

export async function getMemberUnlockByKey(unlockKey: string): Promise<{
  unlockKey: string;
  memberId?: string;
  memberEmail?: string;
  memberName?: string;
  source: string;
  unlockedAt: string;
} | null> {
  const db = getDb();
  const { data, error } = await db
    .from("member_unlocks")
    .select("unlock_key, member_id, member_email, member_name, access_source, unlocked_at")
    .eq("unlock_key", unlockKey)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to query member unlock: ${error.message}`);
  }
  if (!data) return null;

  return {
    unlockKey: data.unlock_key as string,
    memberId: (data.member_id as string | null) || undefined,
    memberEmail: (data.member_email as string | null) || undefined,
    memberName: (data.member_name as string | null) || undefined,
    source: (data.access_source as string) || "webhook",
    unlockedAt: (data.unlocked_at as string) || new Date().toISOString(),
  };
}

export async function applyMemberAccessToSessions(data: {
  memberId?: string;
  memberEmail?: string;
  source: string;
}): Promise<void> {
  const db = getDb();
  const updatePayload = {
    member_id: data.memberId ?? null,
    member_email: data.memberEmail ? data.memberEmail.toLowerCase() : null,
    access_unlocked_at: new Date().toISOString(),
    access_source: data.source,
    updated_at: new Date().toISOString(),
  };

  if (data.memberEmail) {
    await db.from("sessions").update(updatePayload).eq("lead_email", data.memberEmail.toLowerCase());
    await db.from("sessions").update(updatePayload).eq("member_email", data.memberEmail.toLowerCase());
  }

  if (data.memberId) {
    await db.from("sessions").update(updatePayload).eq("member_id", data.memberId);
  }
}

export async function unlockSessionById(data: {
  sessionId: string;
  memberId?: string;
  memberEmail?: string;
  source: string;
}): Promise<void> {
  const db = getDb();
  const { error } = await db
    .from("sessions")
    .update({
      member_id: data.memberId ?? null,
      member_email: data.memberEmail ? data.memberEmail.toLowerCase() : null,
      access_unlocked_at: new Date().toISOString(),
      access_source: data.source,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.sessionId);

  if (error) {
    throw new Error(`Failed to unlock session by id: ${error.message}`);
  }
}

export async function tryRecordWebhookEvent(eventId: string, payload: JsonObject, source = "member_webhook"): Promise<boolean> {
  const db = getDb();
  const { error } = await db.from("member_webhook_events").insert({
    event_id: eventId,
    source,
    payload,
  });

  if (!error) return true;
  // Supabase/Postgres unique violation code.
  if (error.code === "23505") return false;
  throw new Error(`Failed to record webhook event: ${error.message}`);
}
