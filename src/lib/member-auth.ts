import crypto from "crypto";
import {
  type MemberAccessPayload,
  type MemberAccessSource,
} from "@/lib/member-access";
import { getSupabaseAnonClient } from "@/lib/supabase-server";

export interface VerifyResult {
  ok: boolean;
  error?: string;
  access?: MemberAccessPayload;
}

function safeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

async function verifyViaExternalEndpoint(url: string, payload: Record<string, unknown>) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (process.env.MEMBER_AUTH_SHARED_SECRET) {
    headers["x-member-auth-secret"] = process.env.MEMBER_AUTH_SHARED_SECRET;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.ok === false) {
    return {
      ok: false,
      error: data?.error || "External member auth rejected this request.",
    } as VerifyResult;
  }

  return {
    ok: true,
    access: {
      memberId: data?.memberId ? String(data.memberId) : undefined,
      email: data?.email ? String(data.email).toLowerCase() : undefined,
      name: data?.name ? String(data.name) : undefined,
      source: "external_auth",
      unlockedAt: Date.now(),
    },
  } as VerifyResult;
}

export async function verifyPasswordMember(
  identifier: string,
  password: string
): Promise<VerifyResult> {
  const trimmedIdentifier = identifier.trim();
  if (!trimmedIdentifier || !password.trim()) {
    return { ok: false, error: "Username/email and password are required." };
  }

  if (process.env.MEMBER_PASSWORD_VERIFY_URL) {
    return verifyViaExternalEndpoint(process.env.MEMBER_PASSWORD_VERIFY_URL, {
      identifier: trimmedIdentifier,
      password,
    });
  }

  if (!trimmedIdentifier.includes("@")) {
    return {
      ok: false,
      error:
        "Username login needs MEMBER_PASSWORD_VERIFY_URL, or use an email address for Supabase auth.",
    };
  }

  try {
    const supabase = getSupabaseAnonClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedIdentifier.toLowerCase(),
      password,
    });

    if (error || !data.user) {
      return { ok: false, error: "Invalid member credentials." };
    }

    return {
      ok: true,
      access: {
        memberId: data.user.id,
        email: data.user.email?.toLowerCase(),
        name:
          (typeof data.user.user_metadata?.full_name === "string" &&
            data.user.user_metadata.full_name) ||
          (typeof data.user.user_metadata?.name === "string" &&
            data.user.user_metadata.name) ||
          undefined,
        source: "supabase_password",
        unlockedAt: Date.now(),
      },
    };
  } catch {
    return { ok: false, error: "Unable to verify member right now." };
  }
}

function localMembershipKeyFallback(membershipKey: string): VerifyResult {
  const localAdminKey = process.env.ADMIN_EXTENSION_KEY;
  if (!localAdminKey || !safeEqual(membershipKey, localAdminKey)) {
    return { ok: false, error: "Invalid membership key." };
  }

  return {
    ok: true,
    access: {
      memberId: `local-${membershipKey.slice(0, 8)}`,
      source: "membership_key",
      unlockedAt: Date.now(),
    },
  };
}

function normalizeSource(value: unknown): MemberAccessSource {
  if (value === "membership_key") return "membership_key";
  if (value === "supabase_password") return "supabase_password";
  if (value === "external_auth") return "external_auth";
  return "membership_key";
}

export async function verifyMembershipKeyMember(
  membershipKey: string
): Promise<VerifyResult> {
  const trimmedKey = membershipKey.trim();
  if (!trimmedKey) {
    return { ok: false, error: "Membership key is required." };
  }

  if (process.env.MEMBER_KEY_VERIFY_URL) {
    const result = await verifyViaExternalEndpoint(
      process.env.MEMBER_KEY_VERIFY_URL,
      {
        membershipKey: trimmedKey,
      }
    );

    if (result.ok && result.access) {
      result.access.source = normalizeSource(result.access.source);
    }
    return result;
  }

  return localMembershipKeyFallback(trimmedKey);
}
