/** Isolated security fixtures only. None of these identities is available to the app. */
import assert from "node:assert/strict";
import { test, beforeEach, after } from "node:test";
import { createHmac } from "node:crypto";
import { createAccessGuard, type ApiRequest, type ApiResponse } from "../api/_lib/guard";
import { dashboardHandler } from "../api/_lib/dashboard";
import type { PrivateRoster } from "../api/_lib/roster";
import { verifySession, SESSION_COOKIE_NAME } from "../api/_lib/session";
import { resolveAccess } from "../api/_lib/access";
import type { AppRole } from "../src/types";
import { DASHBOARD_PATHS, roleForPath } from "../src/types/dashboard";
import authLogin from "../api/auth/login";
import callback from "../api/auth/callback";
import logout from "../api/auth/logout";

const env = { ...process.env };
const secret = "isolated-dashboard-tests-secret-at-least-32-chars";
beforeEach(() => { process.env.APP_SESSION_SECRET = secret; process.env.NODE_ENV = "development"; delete process.env.VERCEL_ENV; });
after(() => { process.env = env; });
const identities: Record<AppRole, { id: string; role: string }> = {
  STUDENT: { id: "test-student-a", role: "student" }, FACULTY: { id: "test-faculty", role: "faculty" },
  ADMIN: { id: "test-office", role: "staff" }, ORGANISER: { id: "test-organiser", role: "student" }, VIEWER: { id: "test-viewer", role: "hod" },
};
function roster(): PrivateRoster {
  return {
    people: new Map([...Object.values(identities).map(identity => [identity.id, { login_id: identity.id, name: identity.id, email: `${identity.id}@example.invalid`, role: identity.role, ...(identity.role === "student" ? { batch: "2024-28", section: "A", semester: 5 } : {}) }] as const),
      ["test-student-b", { login_id: "test-student-b", name: "private-second-person-sentinel", email: "private-second@example.invalid", role: "student" }]]),
    grants: new Map([[identities.ADMIN.id, "admin"], [identities.ORGANISER.id, "organiser"], [identities.VIEWER.id, "viewer"]]),
    summary: { students: 3, faculty: 1, otherStaff: 2, invalidRows: 0, duplicateRows: 0, batches: [], loadedAt: new Date().toISOString() },
  };
}
function token(role: AppRole, overrides: Record<string, unknown> = {}) {
  const now = Math.floor(Date.now() / 1000);
  const value = { kind: "attendie-eklink-v1", login_id: identities[role].id, sub: "upstream-test-subject", eklink_role: identities[role].role,
    iat: now, exp: now + 28800, verified_at: now, ...overrides };
  const encoded = Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encoded}.${createHmac("sha256", secret).update(encoded).digest("base64url")}`;
}
async function request(handler: (req: ApiRequest, res: ApiResponse) => Promise<void>, options: { token?: string; method?: string; url?: string; host?: string; peer?: string; query?: Record<string, string>; origin?: string } = {}) {
  const req = { method: options.method ?? "GET", url: options.url ?? "/", query: options.query,
    headers: { host: options.host ?? "localhost:3001", ...(options.token ? { cookie: `${SESSION_COOKIE_NAME}=${options.token}` } : {}), ...(options.origin ? { origin: options.origin } : {}) },
    socket: { remoteAddress: options.peer ?? "127.0.0.1" } } as unknown as ApiRequest;
  let data: any;
  const headers: Record<string, string> = {};
  const res = { statusCode: 200, setHeader(name: string, value: string) { headers[name.toLowerCase()] = value; }, end(body: string) { data = JSON.parse(body); } } as unknown as ApiResponse;
  await handler(req, res);
  return { code: res.statusCode, data, headers };
}
function handlers(data = roster()) {
  const guard = createAccessGuard(async () => data);
  return Object.fromEntries(Object.keys(identities).map(role => [role, dashboardHandler(role as AppRole, guard)])) as Record<AppRole, ReturnType<typeof dashboardHandler>>;
}

test("all 25 role/dashboard combinations enforce exact server access", async () => {
  const endpoints = handlers();
  for (const userRole of Object.keys(identities) as AppRole[]) {
    for (const routeRole of Object.keys(identities) as AppRole[]) {
      const result = await request(endpoints[routeRole], { token: token(userRole) });
      assert.equal(result.code, userRole === routeRole ? 200 : 403, `${userRole} -> ${routeRole}`);
      assert.match(result.headers["cache-control"], /no-store/);
    }
  }
});
test("every dashboard rejects unauthenticated requests before loading private records", async () => {
  let calls = 0;
  const guard = createAccessGuard(async () => { calls++; return roster(); });
  for (const role of Object.keys(identities) as AppRole[]) assert.equal((await request(dashboardHandler(role, guard))).code, 401);
  assert.equal(calls, 0);
});
test("student response includes only the session owner's profile and no roster or other person", async () => {
  const result = await request(handlers().STUDENT, { token: token("STUDENT") });
  assert.equal(result.code, 200);
  assert.equal(result.data.profile.loginId, identities.STUDENT.id);
  assert.equal(result.data.roster, undefined);
  assert.doesNotMatch(JSON.stringify(result.data), /private-second-person|private-second@|test-student-b/);
  assert.equal((await request(handlers().FACULTY, { token: token("FACULTY") })).data.roster, undefined);
});
test("identity selectors and wrong methods cannot turn a dashboard into a profile lookup", async () => {
  for (const url of ["/?prn=test-student-b", "/?login_id=test-office", "/?role=ADMIN"]) {
    assert.equal((await request(handlers().STUDENT, { token: token("STUDENT"), url })).code, 400);
  }
  assert.equal((await request(handlers().STUDENT, { token: token("STUDENT"), query: { user_id: "test-student-b" } })).code, 400);
  assert.equal((await request(handlers().ADMIN, { token: token("ADMIN"), method: "POST" })).code, 405);
});
test("admin and viewer need explicit grants; changed/missing/unsupported identities are denied", async () => {
  const data = roster();
  data.grants.delete(identities.ADMIN.id);
  data.grants.delete(identities.VIEWER.id);
  assert.equal((await request(handlers(data).ADMIN, { token: token("ADMIN") })).code, 403);
  assert.equal((await request(handlers(data).VIEWER, { token: token("VIEWER") })).code, 403);
  data.people.delete(identities.STUDENT.id);
  assert.equal((await request(handlers(data).STUDENT, { token: token("STUDENT") })).code, 403);
  data.people.get(identities.FACULTY.id)!.role = "director";
  assert.equal((await request(handlers(data).FACULTY, { token: token("FACULTY") })).code, 403);
  const testIdentity = { login_id: identities.ORGANISER.id, eklink_role: "student", sub: "x", iat: 0, exp: 1, verified_at: 0 };
  data.grants.set(testIdentity.login_id, "admin");
  assert.equal(resolveAccess(testIdentity, data), null);
});
test("signatures, timestamp shape, expiry, revalidation and old session kinds fail closed", async () => {
  const now = Math.floor(Date.now() / 1000);
  const bad = ["%ZZ", "tampered.cookie", `${token("STUDENT")}x`, token("STUDENT", { kind: "attendie-dev-v1" }),
    token("STUDENT", { exp: now }), token("STUDENT", { exp: now + 28801 }), token("STUDENT", { iat: now + 60 }),
    token("STUDENT", { exp: String(now + 60) }), token("STUDENT", { sub: "" }), token("STUDENT", { verified_at: now + 1 }),
    token("STUDENT", { iat: now - 901, verified_at: now - 900, exp: now + 1000 })];
  for (const value of bad) assert.equal((await request(handlers().STUDENT, { token: value })).code, 401);
  const valid = token("STUDENT");
  delete process.env.APP_SESSION_SECRET;
  assert.equal((await request(handlers().STUDENT, { token: valid })).code, 401);
});
test("local real-data endpoints fail closed in cloud/production and remote requests", async () => {
  const value = token("ADMIN");
  assert.equal((await request(handlers().ADMIN, { token: value, host: "localhost.evil.example" })).code, 503);
  assert.equal((await request(handlers().ADMIN, { token: value, peer: "192.168.1.2" })).code, 503);
  for (const environment of ["production", "preview"]) {
    process.env.VERCEL_ENV = environment;
    assert.equal((await request(handlers().ADMIN, { token: value })).code, 503);
  }
  delete process.env.VERCEL_ENV;
  process.env.NODE_ENV = "production";
  assert.equal((await request(handlers().ADMIN, { token: value })).code, 503);
});
test("upstream sign-in/callback cannot mint a session until EkLink is integrated", async () => {
  for (const handler of [authLogin, callback]) {
    const result = await request(handler);
    assert.equal(result.code, 503);
    assert.equal(result.headers["set-cookie"], undefined);
  }
});
test("logout is same-origin POST only, clears the cookie and uses Secure in production", async () => {
  assert.equal((await request(logout)).code, 405);
  assert.equal((await request(logout, { method: "POST", origin: "https://untrusted.invalid" })).code, 403);
  const result = await request(logout, { method: "POST", origin: "http://localhost:3001" });
  assert.match(result.headers["set-cookie"], /HttpOnly; SameSite=Lax; Max-Age=0/);
  process.env.NODE_ENV = "production";
  assert.match((await request(logout, { method: "POST" })).headers["set-cookie"], /Secure/);
});
test("browser dashboard paths map to a single known role; arbitrary IDs are not routes", () => {
  for (const [role, path] of Object.entries(DASHBOARD_PATHS)) assert.equal(roleForPath(path), role);
  assert.equal(roleForPath("/dashboard/student/test-student-b"), null);
  assert.equal(roleForPath("/dashboard/ADMIN"), null);
});
