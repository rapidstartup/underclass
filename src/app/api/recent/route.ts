import { NextResponse } from "next/server";
import { getRecentSessions, initDb } from "@/lib/db";
import { hasSupabaseConfig } from "@/lib/supabase-server";

export async function GET() {
  try {
    if (!hasSupabaseConfig()) {
      return NextResponse.json({ sessions: [] });
    }

    await initDb();
    const sessions = await getRecentSessions(30);
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Recent sessions error:", error);
    return NextResponse.json({ sessions: [] });
  }
}
