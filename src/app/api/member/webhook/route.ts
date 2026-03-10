import crypto from "crypto";
import { NextResponse } from "next/server";
import {
  applyMemberAccessToSessions,
  initDb,
  tryRecordWebhookEvent,
  unlockSessionById,
  upsertMemberUnlock,
} from "@/lib/db";
import { hasSupabaseConfig } from "@/lib/supabase-server";

function safeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function extractSignature(req: Request): string {
  return (
    req.headers.get("x-webhook-signature") ||
    req.headers.get("x-whop-signature") ||
    req.headers.get("x-signature") ||
    ""
  );
}

function verifySignature(rawBody: string, signature: string): boolean {
  const secrets = [
    process.env.MEMBER_WEBHOOK_SECRET,
    process.env.WHOP_SALES_WEBHOOK_SECRET,
    process.env.WHOP_WEBHOOK_SECRET,
  ].filter(Boolean) as string[];

  if (secrets.length === 0) return false;
  if (!signature) return false;

  return secrets.some((secret) => {
    const hexDigest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    const base64Digest = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
    return (
      safeEqual(signature, secret) ||
      safeEqual(signature, hexDigest) ||
      safeEqual(signature, base64Digest) ||
      safeEqual(signature, `sha256=${hexDigest}`)
    );
  });
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function readString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = extractSignature(req);

    if (!verifySignature(rawBody, signature)) {
      return NextResponse.json({ ok: false, error: "Invalid webhook signature." }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    const data = asObject(payload.data);
    const inner = asObject(data.payload);

    const eventId =
      readString(payload, ["event_id", "id"]) ||
      readString(data, ["event_id", "id"]) ||
      crypto.createHash("sha1").update(rawBody).digest("hex");

    if (!hasSupabaseConfig()) {
      return NextResponse.json({ ok: false, error: "Database not configured." }, { status: 503 });
    }
    await initDb();

    const isNewEvent = await tryRecordWebhookEvent(eventId, payload, "member_webhook");
    if (!isNewEvent) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    const unlockKey =
      readString(payload, ["unlockKey", "unlock_key"]) ||
      readString(data, ["unlockKey", "unlock_key"]) ||
      readString(inner, ["unlockKey", "unlock_key"]);
    const sessionId =
      readString(payload, ["sessionId", "session_id"]) ||
      readString(data, ["sessionId", "session_id"]) ||
      readString(inner, ["sessionId", "session_id"]);

    const memberEmail =
      readString(payload, ["email", "member_email"]) ||
      readString(data, ["email", "member_email"]) ||
      readString(inner, ["email", "member_email"]);
    const memberId =
      readString(payload, ["memberId", "member_id", "user_id"]) ||
      readString(data, ["memberId", "member_id", "user_id"]) ||
      readString(inner, ["memberId", "member_id", "user_id"]);
    const memberName =
      readString(payload, ["name", "member_name"]) ||
      readString(data, ["name", "member_name"]) ||
      readString(inner, ["name", "member_name"]);

    if (!unlockKey && !sessionId && !memberEmail && !memberId) {
      return NextResponse.json(
        { ok: false, error: "Webhook did not include unlock/session/member identity." },
        { status: 400 }
      );
    }

    if (unlockKey) {
      await upsertMemberUnlock({
        unlockKey,
        memberId: memberId || undefined,
        memberEmail: memberEmail || undefined,
        memberName: memberName || undefined,
        source: "webhook",
        eventId,
        payload,
      });
    }

    if (sessionId) {
      await unlockSessionById({
        sessionId,
        memberId: memberId || undefined,
        memberEmail: memberEmail || undefined,
        source: "webhook",
      });
    }

    if (memberEmail || memberId) {
      await applyMemberAccessToSessions({
        memberId: memberId || undefined,
        memberEmail: memberEmail || undefined,
        source: "webhook",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Member webhook error:", error);
    return NextResponse.json({ ok: false, error: "Failed to process webhook." }, { status: 500 });
  }
}
