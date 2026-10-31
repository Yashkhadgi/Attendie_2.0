import { type NextRequest, NextResponse } from "next/server";
import { refreshEklinkToken, verifyEklinkToken } from "@/lib/eklink";
import { SESSION_COOKIE, cookieOpts, readSession, signSession } from "@/lib/session";
import { upsertPerson } from "@/lib/people";
import { safeNext } from "@/lib/safe-next";
import { required } from "@/lib/env";

export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next") ?? "/";
  const validNext = safeNext(next);
  const s = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  const fail = () => {
    const r = NextResponse.redirect(new URL("/auth/login", required("APP_URL")));
    r.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
    return r;
  };
  if (!s) return fail();
  const fresh = await refreshEklinkToken(s.tok);
  if (!fresh) return fail();

  try {
    const c = await verifyEklinkToken(fresh);
    await upsertPerson(c);
    const jwt = await signSession({
      ...s,
      tok: fresh,
      tok_exp: c.exp,
      eklink_role: c.role,
      name: c.name,
      email: c.email,
      department: c.department,
      batch: c.batch,
      section: c.section,
    });
    const res = NextResponse.redirect(new URL(validNext, required("APP_URL")));
    res.cookies.set(SESSION_COOKIE, jwt, cookieOpts(Math.max(s.exp - Math.floor(Date.now() / 1000), 1)));
    return res;
  } catch {
    return fail();
  }
}
