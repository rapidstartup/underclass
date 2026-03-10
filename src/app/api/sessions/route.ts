import { NextResponse } from "next/server";
import { createSession, getMemberUnlockByKey, getSession, getSessionsByProfile, initDb, normalizeProfileUrl } from "@/lib/db";
import { hasSupabaseConfig } from "@/lib/supabase-server";

function normalizeEmail(value: string | undefined): string {
  return (value || "").trim().toLowerCase();
}

function canUnlockAccessSession(
  session: { memberId?: string; memberEmail?: string; accessUnlockedAt?: string },
  unlocked: { memberId?: string; memberEmail?: string } | null
): boolean {
  const isProtected = Boolean(session.accessUnlockedAt || session.memberId || session.memberEmail);
  if (!isProtected) return true;
  if (!unlocked) return false;

  if (session.memberId && unlocked.memberId && session.memberId === unlocked.memberId) {
    return true;
  }

  const sessionEmail = normalizeEmail(session.memberEmail);
  const unlockEmail = normalizeEmail(unlocked.memberEmail);
  if (sessionEmail && unlockEmail && sessionEmail === unlockEmail) {
    return true;
  }

  return false;
}

// POST — save a session
export async function POST(req: Request) {
  try {
    if (!hasSupabaseConfig()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    await initDb();

    const {
      linkedinUrl,
      personName,
      profileData,
      messages,
      finalPul,
      isPublic,
      memberEmail,
      memberId,
      accessSource,
    } = await req.json();

    const safeLinkedinUrl =
      linkedinUrl ||
      (profileData?.linkedinUrl as string | undefined) ||
      (profileData?.url as string | undefined) ||
      (profileData?.handle ? `https://x.com/${String(profileData.handle)}` : "");

    if (!safeLinkedinUrl || !messages) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const id = await createSession({
      linkedinUrl: safeLinkedinUrl,
      personName: personName || "",
      profileData: profileData || {},
      messages,
      finalPul,
      isPublic: typeof isPublic === "boolean" ? isPublic : true,
      memberEmail: memberEmail || undefined,
      memberId: memberId || undefined,
      accessSource: accessSource || undefined,
    });

    const shareUrl = `https://replaceproof.com/s/${id}`;

    return NextResponse.json({ id, shareUrl });
  } catch (error) {
    console.error("Session create error:", error);
    return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
  }
}

// GET — load a session
export async function GET(req: Request) {
  try {
    if (!hasSupabaseConfig()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    await initDb();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const profile = searchParams.get("profile");
    const intent = searchParams.get("intent");
    const unlockKey = searchParams.get("unlockKey");
    const limitRaw = Number.parseInt(searchParams.get("limit") || "5", 10);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(10, limitRaw)) : 5;

    const unlocked = unlockKey ? await getMemberUnlockByKey(unlockKey) : null;

    if (profile) {
      const sessions = await getSessionsByProfile(normalizeProfileUrl(profile), limit);
      const decorated = sessions.map((s) => {
        const isProtected = Boolean(s.accessUnlockedAt || s.memberId || s.memberEmail);
        return {
          id: s.id,
          personName: s.personName,
          finalPul: s.finalPul,
          createdAt: s.createdAt,
          isProtected,
          canContinue: canUnlockAccessSession(s, unlocked),
        };
      });
      return NextResponse.json({ sessions: decorated });
    }

    if (!id) {
      return NextResponse.json({ error: "Missing session ID" }, { status: 400 });
    }

    const session = await getSession(id);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (intent === "continue") {
      if (!canUnlockAccessSession(session, unlocked)) {
        return NextResponse.json(
          { error: "Member key required to continue this session." },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("Session load error:", error);
    return NextResponse.json({ error: "Failed to load session" }, { status: 500 });
  }
}
