import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, readSession, type Session } from "@/lib/session";

/** Returns a valid session or redirects. `next` is the current path, used to come back after login/refresh. */
export async function requireSession(next = "/"): Promise<Session> {
  const s = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!s) redirect("/auth/login");
  if (s.tok_exp - 60 < Math.floor(Date.now() / 1000)) redirect(`/auth/refresh?next=${encodeURIComponent(next)}`);
  return s;
}
