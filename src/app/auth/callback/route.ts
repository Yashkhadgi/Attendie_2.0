import { timingSafeEqual } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { exchangeCode, verifyEklinkToken } from "@/lib/eklink";
import { SESSION_COOKIE, SESSION_MAX_AGE, cookieOpts, signSession } from "@/lib/session";
import { upsertPerson } from "@/lib/people";
import { required } from "@/lib/env";

const same = (a: string, b: string) =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const to = (path: string) => NextResponse.redirect(new URL(path, required("APP_URL")));

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const saved = request.cookies.get("eklink_state")?.value;

  let res = to("/auth/error?e=state");
  if (code && state && saved && same(state, saved)) {
    try {
      const token = await exchangeCode(code);
      const c = await verifyEklinkToken(token);
      await upsertPerson(c);
      const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
      const jwt = await signSession({
        sub: c.sub,
        login_id: c.login_id,
        name: c.name,
        email: c.email,
        eklink_role: c.role,
        department: c.department,
        batch: c.batch,
        section: c.section,
        tok: token,
        tok_exp: c.exp,
        exp,
      });
      res = to("/");
      res.cookies.set(SESSION_COOKIE, jwt, cookieOpts(SESSION_MAX_AGE));
    } catch {
      res = to("/auth/error?e=signin");
    }
  }
  res.cookies.set("eklink_state", "", { path: "/auth", maxAge: 0 });
  return res;
}
