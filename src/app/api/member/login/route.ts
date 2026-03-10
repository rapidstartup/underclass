import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE_NAME,
  encodeAccessCookie,
  maskMemberId,
} from "@/lib/member-access";
import {
  verifyMembershipKeyMember,
  verifyPasswordMember,
} from "@/lib/member-auth";
import {
  applyMemberAccessToSessions,
  initDb,
  upsertMemberUnlock,
} from "@/lib/db";
import { hasSupabaseConfig } from "@/lib/supabase-server";

interface LoginBody {
  method?: "password" | "membershipKey";
  identifier?: string;
  password?: string;
  membershipKey?: string;
  unlockKey?: string | null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LoginBody;
    const method = body.method || "password";

    const result =
      method === "membershipKey"
        ? await verifyMembershipKeyMember(body.membershipKey || "")
        : await verifyPasswordMember(body.identifier || "", body.password || "");

    if (!result.ok || !result.access) {
      return NextResponse.json(
        { ok: false, error: result.error || "Unable to verify member access." },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set({
      name: ACCESS_COOKIE_NAME,
      value: encodeAccessCookie(result.access),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    if (hasSupabaseConfig()) {
      try {
        await initDb();
        if (body.unlockKey) {
          await upsertMemberUnlock({
            unlockKey: body.unlockKey,
            memberId: result.access.memberId,
            memberEmail: result.access.email,
            memberName: result.access.name,
            source: result.access.source,
            payload: {
              type: "member_login",
              source: result.access.source,
            },
          });
        }
        await applyMemberAccessToSessions({
          memberId: result.access.memberId,
          memberEmail: result.access.email,
          source: result.access.source,
        });
      } catch (dbError) {
        console.error("Member login DB sync error:", dbError);
      }
    }

    return NextResponse.json({
      ok: true,
      unlocked: true,
      source: result.access.source,
      member: {
        memberId: maskMemberId(result.access.memberId),
        email: result.access.email || null,
        name: result.access.name || null,
      },
    });
  } catch (error) {
    console.error("Member login error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to process member login request." },
      { status: 500 }
    );
  }
}
