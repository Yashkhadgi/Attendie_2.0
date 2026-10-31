/** Regression: the old persona login is permanently closed, regardless of flags. */
import assert from "node:assert/strict";
import { test } from "node:test";
import login from "../api/dev/login";
import status from "../api/dev/status";
import oldAdminCheck from "../api/dev/admin-only-test";
import { verifySession } from "../api/_lib/session";
import { createHmac } from "node:crypto";
import type { ApiRequest, ApiResponse } from "../api/_lib/guard";

test("legacy persona routes cannot create or verify a development identity", async () => {
  const before = { ...process.env };
  try {
    process.env.DEV_FAKE_LOGIN = "true";
    process.env.NODE_ENV = "development";
    process.env.APP_SESSION_SECRET = "isolated-security-test-secret-more-than-32-chars";
    const encoded = Buffer.from(JSON.stringify({ kind: "attendie-dev-v1", login_id: "test-only", attendieRole: "ADMIN" })).toString("base64url");
    const signature = createHmac("sha256", process.env.APP_SESSION_SECRET).update(encoded).digest("base64url");
    const req = { method: "POST", headers: { host: "localhost:3001", cookie: `attendie_session=${encoded}.${signature}` }, body: { key: "ADMIN" } } as unknown as ApiRequest;
    assert.equal(verifySession(req), null);
    for (const handler of [login, oldAdminCheck, status]) {
      let data: any;
      const headers: Record<string, string> = {};
      const res = { statusCode: 200, setHeader(name: string, value: string) { headers[name] = value; }, end(body: string) { data = JSON.parse(body); } } as unknown as ApiResponse;
      await handler(req, res);
      if (handler === status) assert.equal(data.enabled, false);
      else assert.equal(res.statusCode, 404);
      assert.equal(headers["Set-Cookie"], undefined);
    }
  } finally { process.env = before; }
});
