import crypto from "crypto";

export const ACCESS_COOKIE_NAME = "replaceproof_member_access";

export type MemberAccessSource =
  | "supabase_password"
  | "membership_key"
  | "external_auth"
  | "webhook";

export interface MemberAccessPayload {
  memberId?: string;
  email?: string;
  name?: string;
  source: MemberAccessSource;
  unlockedAt: number;
}

function getAccessCookieSecret(): string {
  const secret =
    process.env.MEMBER_ACCESS_COOKIE_SECRET ||
    process.env.DEPLOYMENT_ENCRYPT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error("Missing member access cookie secret.");
  }
  return secret;
}

function signValue(value: string): string {
  return crypto
    .createHmac("sha256", getAccessCookieSecret())
    .update(value)
    .digest("base64url");
}

export function encodeAccessCookie(payload: MemberAccessPayload): string {
  const rawPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = signValue(rawPayload);
  return `${rawPayload}.${signature}`;
}

export function decodeAccessCookie(cookieValue: string | undefined): MemberAccessPayload | null {
  if (!cookieValue) return null;
  const [rawPayload, signature] = cookieValue.split(".");
  if (!rawPayload || !signature) return null;

  const expected = signValue(rawPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  try {
    const json = Buffer.from(rawPayload, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as MemberAccessPayload;
    if (!parsed || !parsed.source || !parsed.unlockedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function maskMemberId(value: string | undefined): string {
  if (!value) return "";
  if (value.length <= 8) return value;
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}
