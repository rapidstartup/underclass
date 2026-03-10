import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE_NAME,
  decodeAccessCookie,
  encodeAccessCookie,
} from "@/lib/member-access";
import { getMemberUnlockByKey, initDb } from "@/lib/db";
import { hasSupabaseConfig } from "@/lib/supabase-server";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const payload = decodeAccessCookie(cookieStore.get(ACCESS_COOKIE_NAME)?.value);

    if (payload) {
      return NextResponse.json({
        ok: true,
        unlocked: true,
        member: {
          memberId: payload.memberId || null,
          email: payload.email || null,
          name: payload.name || null,
        },
        source: payload.source,
        unlockedAt: payload.unlockedAt,
      });
    }

    const url = new URL(req.url);
    const unlockKey = url.searchParams.get("unlockKey");
    if (!unlockKey || !hasSupabaseConfig()) {
      return NextResponse.json({ ok: true, unlocked: false });
    }

    await initDb();
    const unlocked = await getMemberUnlockByKey(unlockKey);
    if (!unlocked) {
      return NextResponse.json({ ok: true, unlocked: false });
    }

    const cookiePayload = {
      memberId: unlocked.memberId,
      email: unlocked.memberEmail,
      name: unlocked.memberName,
      source: unlocked.source === "webhook" ? "webhook" : "external_auth",
      unlockedAt: Date.now(),
    } as const;

    cookieStore.set({
      name: ACCESS_COOKIE_NAME,
      value: encodeAccessCookie(cookiePayload),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return NextResponse.json({ ok: true, unlocked: true, source: "webhook" });
  } catch (error) {
    console.error("Member status error:", error);
    return NextResponse.json({ ok: true, unlocked: false }, { status: 200 });
  }
}
