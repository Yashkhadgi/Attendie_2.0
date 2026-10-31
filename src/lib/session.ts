import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { requiredSecret } from "./env";

export const SESSION_COOKIE = "attendie_session";
export const SESSION_MAX_AGE = 8 * 3600;

export type Session = {
  sub: string;
  login_id: string;
  name: string;
  email: string;
  eklink_role: string;
  department: string | null;
  batch: string | null;
  section: string | null;
  tok: string;
  tok_exp: number;
  exp: number;
};

export const cookieOpts = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});

function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(requiredSecret("APP_SESSION_SECRET"));
}

export async function signSession(s: Session) {
  return new SignJWT(s as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .sign(getSecretKey());
}

export async function readSession(raw?: string): Promise<Session | null> {
  if (!raw) return null;
  const key = getSecretKey();
  try {
    return (await jwtVerify(raw, key, { algorithms: ["HS256"] })).payload as unknown as Session;
  } catch {
    return null;
  }
}

/** Read-only helper for Server Components and Route Handlers. It cannot refresh (cookies are read-only
 *  while rendering). Returns null when the EkLink token needs a refresh; send the user to /auth/refresh. */
export async function getSession(): Promise<Session | null> {
  const s = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!s) return null;
  if (s.tok_exp <= Math.floor(Date.now() / 1000)) return null;
  return s;
}
