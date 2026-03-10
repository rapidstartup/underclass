import { NextResponse } from "next/server";
import { captureSessionLead, initDb } from "@/lib/db";
import { hasSupabaseConfig } from "@/lib/supabase-server";

interface LeadBody {
  sessionId?: string;
  name?: string;
  email?: string;
  intent?: "upgrade" | "login" | "skip";
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export async function POST(req: Request) {
  try {
    if (!hasSupabaseConfig()) {
      return NextResponse.json({ ok: false, error: "Database not configured." }, { status: 503 });
    }

    const body = (await req.json()) as LeadBody;
    if (!body.sessionId) {
      return NextResponse.json({ ok: false, error: "Missing session ID." }, { status: 400 });
    }

    const leadName = (body.name || "").trim();
    const leadEmail = (body.email || "").trim();
    if (!leadName || !leadEmail) {
      return NextResponse.json(
        { ok: false, error: "Name and email are required." },
        { status: 400 }
      );
    }

    await initDb();
    await captureSessionLead({
      sessionId: body.sessionId,
      leadName,
      leadEmail: normalizeEmail(leadEmail),
      upgradeIntent: body.intent || "upgrade",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Member lead capture error:", error);
    return NextResponse.json({ ok: false, error: "Failed to capture lead." }, { status: 500 });
  }
}
