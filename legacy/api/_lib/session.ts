/** Real-identity session boundary. No public handler may mint a session before EkLink verification. */
import crypto from "node:crypto";
import type { IncomingMessage } from "node:http";

export const SESSION_COOKIE_NAME = "attendie_session";
export const SESSION_DURATION_SECONDS = 8 * 60 * 60;
export const IDENTITY_RECHECK_SECONDS = 15 * 60;
export interface VerifiedSession {
  login_id: string;
  sub: string;
  eklink_role: string;
  iat: number;
  exp: number;
  verified_at: number;
}
export interface SessionPayload extends VerifiedSession { kind: "attendie-eklink-v1" }

function getSessionSecret(): string | null {
  const secret = process.env.APP_SESSION_SECRET;
  return secret && secret.trim().length >= 32 && !/change-me|your-32-char|dev-only-fallback/i.test(secret) ? secret : null;
}
export function parseCookies(req: IncomingMessage): Record<string, string> {
  const result: Record<string, string> = Object.create(null);
  for (const part of (req.headers.cookie ?? "").split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (!name) continue;
    try { result[name] = decodeURIComponent(rest.join("=")); } catch { return Object.create(null); }
  }
  return result;
}
export function verifySession(req: IncomingMessage): VerifiedSession | null {
  const secret = getSessionSecret();
  const token = parseCookies(req)[SESSION_COOKIE_NAME];
  if (!secret || !token || token.length > 4096) return null;
  const parts = token.split(".");
  if (parts.length !== 2 || !parts.every(part => /^[A-Za-z0-9_-]+$/.test(part))) return null;
  const [encoded, signature] = parts;
  const expected = Buffer.from(crypto.createHmac("sha256", secret).update(encoded).digest("base64url"));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
  try {
    const value = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    const now = Math.floor(Date.now() / 1000);
    if (!value || value.kind !== "attendie-eklink-v1"
      || ![value.iat, value.exp, value.verified_at].every(Number.isInteger)
      || value.iat > now || value.exp <= now || value.exp <= value.iat
      || value.exp - value.iat > SESSION_DURATION_SECONDS
      || value.verified_at < value.iat || value.verified_at > now
      || now - value.verified_at >= IDENTITY_RECHECK_SECONDS
      || typeof value.login_id !== "string" || !value.login_id.trim()
      || typeof value.sub !== "string" || !value.sub.trim()
      || typeof value.eklink_role !== "string" || !value.eklink_role.trim()) return null;
    return { login_id: value.login_id, sub: value.sub, eklink_role: value.eklink_role,
      iat: value.iat, exp: value.exp, verified_at: value.verified_at };
  } catch { return null; }
}
export function clearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}
