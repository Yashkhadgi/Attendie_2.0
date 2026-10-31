import { describe, it, expect, beforeAll, vi } from "vitest";
import {
  generateKeyPair,
  exportJWK,
  SignJWT,
  createLocalJWKSet,
} from "jose";
import { NextRequest } from "next/server";
import { verifyEklinkToken, type EklinkClaims } from "@/lib/eklink";
import { rolesFor, resolveRoles } from "@/lib/roles";
import { safeNext } from "@/lib/safe-next";
import { signSession, readSession, type Session } from "@/lib/session";
import { getDb } from "@/lib/people";
import { proxy } from "@/proxy";

describe("Hardened Auth Tests", () => {
  const ISSUER = "https://ek-link-nine.vercel.app";
  const AUDIENCE = "attendie-client-id";
  const VALID_SECRET = "attendie-test-secret-at-least-32-chars-long";

  let privateKey: CryptoKey;
  let publicKey: CryptoKey;
  let keySet: ReturnType<typeof createLocalJWKSet>;
  let forgedPrivateKey: CryptoKey;

  beforeAll(async () => {
    process.env.EKLINK_ISSUER = ISSUER;
    process.env.EKLINK_CLIENT_ID = AUDIENCE;
    process.env.EKLINK_URL = "https://ek-link-nine.vercel.app";
    process.env.EKLINK_REDIRECT_URI = "http://localhost:3001/auth/callback";
    process.env.EKLINK_CLIENT_SECRET = "test-client-secret";
    process.env.APP_URL = "http://localhost:3001";
    process.env.APP_SESSION_SECRET = VALID_SECRET;
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "test-secret-key";

    // Legitimate keypair
    const keyPair = await generateKeyPair("ES256");
    privateKey = keyPair.privateKey;
    publicKey = keyPair.publicKey;
    const jwk = await exportJWK(publicKey);
    keySet = createLocalJWKSet({ keys: [jwk] });

    // Separate untrusted keypair for forged test
    const untrustedPair = await generateKeyPair("ES256");
    forgedPrivateKey = untrustedPair.privateKey;
  });

  describe("8(a) signSession & readSession secret validation", () => {
    const dummySession: Session = {
      sub: "11111111-2222-3333-4444-555555555555",
      login_id: "testuser",
      name: "Test User",
      email: "test@example.com",
      eklink_role: "student",
      department: "CSE",
      batch: "2024",
      section: "A",
      tok: "eklink-access-token",
      tok_exp: Math.floor(Date.now() / 1000) + 900,
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    it("throws when APP_SESSION_SECRET is missing", async () => {
      const orig = process.env.APP_SESSION_SECRET;
      delete process.env.APP_SESSION_SECRET;
      try {
        await expect(signSession(dummySession)).rejects.toThrow("Missing env APP_SESSION_SECRET");
        await expect(readSession("some.jwt.token")).rejects.toThrow("Missing env APP_SESSION_SECRET");
      } finally {
        process.env.APP_SESSION_SECRET = orig;
      }
    });

    it("throws when APP_SESSION_SECRET is shorter than 32 chars", async () => {
      const orig = process.env.APP_SESSION_SECRET;
      process.env.APP_SESSION_SECRET = "short-secret";
      try {
        await expect(signSession(dummySession)).rejects.toThrow(
          "Secret env APP_SESSION_SECRET must be at least 32 characters"
        );
        await expect(readSession("some.jwt.token")).rejects.toThrow(
          "Secret env APP_SESSION_SECRET must be at least 32 characters"
        );
      } finally {
        process.env.APP_SESSION_SECRET = orig;
      }
    });

    it("signs and reads session successfully when secret is valid", async () => {
      const jwt = await signSession(dummySession);
      const read = await readSession(jwt);
      expect(read).not.toBeNull();
      expect(read?.login_id).toBe("testuser");
      expect(read?.email).toBe("test@example.com");
    });
  });

  describe("8(b) verifyEklinkToken validation & rejection checks", () => {
    const createValidClaims = (): EklinkClaims => ({
      sub: "11111111-2222-3333-4444-555555555555",
      login_id: "testuser",
      email: "test@sitnagpur.ac.in",
      name: "Test User",
      role: "student",
      department: "CSE",
      batch: "2024-2028",
      section: "A",
      ver: 1,
      exp: Math.floor(Date.now() / 1000) + 900,
    });

    it("throws when EKLINK_ISSUER is unset", async () => {
      const origIssuer = process.env.EKLINK_ISSUER;
      delete process.env.EKLINK_ISSUER;
      try {
        await expect(verifyEklinkToken("dummy-token", keySet)).rejects.toThrow(
          "Missing env EKLINK_ISSUER"
        );
      } finally {
        process.env.EKLINK_ISSUER = origIssuer;
      }
    });

    it("throws when EKLINK_CLIENT_ID is unset", async () => {
      const origAud = process.env.EKLINK_CLIENT_ID;
      delete process.env.EKLINK_CLIENT_ID;
      try {
        await expect(verifyEklinkToken("dummy-token", keySet)).rejects.toThrow(
          "Missing env EKLINK_CLIENT_ID"
        );
      } finally {
        process.env.EKLINK_CLIENT_ID = origAud;
      }
    });

    it("verifies a valid ES256 token matching issuer and audience", async () => {
      const claims = createValidClaims();
      const token = await new SignJWT(claims as unknown as Record<string, unknown>)
        .setProtectedHeader({ alg: "ES256" })
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .setExpirationTime("15m")
        .sign(privateKey);

      const verified = await verifyEklinkToken(token, keySet);
      expect(verified.login_id).toBe("testuser");
      expect(verified.name).toBe("Test User");
      expect(verified.role).toBe("student");
    });

    it("rejects forged tokens signed with an unknown private key", async () => {
      const claims = createValidClaims();
      const forgedToken = await new SignJWT(claims as unknown as Record<string, unknown>)
        .setProtectedHeader({ alg: "ES256" })
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .setExpirationTime("15m")
        .sign(forgedPrivateKey);

      await expect(verifyEklinkToken(forgedToken, keySet)).rejects.toThrow();
    });

    it("rejects expired tokens", async () => {
      const claims = createValidClaims();
      const expiredToken = await new SignJWT(claims as unknown as Record<string, unknown>)
        .setProtectedHeader({ alg: "ES256" })
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
        .sign(privateKey);

      await expect(verifyEklinkToken(expiredToken, keySet)).rejects.toThrow();
    });

    it("rejects wrong-aud tokens", async () => {
      const claims = createValidClaims();
      const wrongAudToken = await new SignJWT(claims as unknown as Record<string, unknown>)
        .setProtectedHeader({ alg: "ES256" })
        .setIssuer(ISSUER)
        .setAudience("wrong-client-id")
        .setExpirationTime("15m")
        .sign(privateKey);

      await expect(verifyEklinkToken(wrongAudToken, keySet)).rejects.toThrow();
    });

    it("rejects wrong-iss tokens", async () => {
      const claims = createValidClaims();
      const wrongIssToken = await new SignJWT(claims as unknown as Record<string, unknown>)
        .setProtectedHeader({ alg: "ES256" })
        .setIssuer("https://imposter-issuer.com")
        .setAudience(AUDIENCE)
        .setExpirationTime("15m")
        .sign(privateKey);

      await expect(verifyEklinkToken(wrongIssToken, keySet)).rejects.toThrow();
    });

    it("rejects HS256 tokens", async () => {
      const claims = createValidClaims();
      const symmetricKey = new TextEncoder().encode("symmetric-secret-key-that-is-long-enough");
      const hs256Token = await new SignJWT(claims as unknown as Record<string, unknown>)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .setExpirationTime("15m")
        .sign(symmetricKey);

      await expect(verifyEklinkToken(hs256Token, keySet)).rejects.toThrow();
    });
  });

  describe("8(c) proxy middleware enforcement", () => {
    it("returns 401 JSON for /api/me with no cookie", async () => {
      const req = new NextRequest("http://localhost:3001/api/me");
      const res = proxy(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });

    it("redirects for /admin with no cookie", () => {
      const req = new NextRequest("http://localhost:3001/admin");
      const res = proxy(req);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("http://localhost:3001/auth/login");
    });

    it("allows public paths without cookie", () => {
      const req = new NextRequest("http://localhost:3001/auth/login");
      const res = proxy(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("location")).toBeNull();
    });

    it("allows request when session cookie exists", () => {
      const req = new NextRequest("http://localhost:3001/admin", {
        headers: { cookie: "attendie_session=test-jwt" },
      });
      const res = proxy(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("location")).toBeNull();
    });
  });

  describe("8(d) people client creation throws without env", () => {
    it("throws without SUPABASE_URL or SUPABASE_SECRET_KEY", () => {
      const origUrl = process.env.SUPABASE_URL;
      const origKey = process.env.SUPABASE_SECRET_KEY;

      try {
        delete process.env.SUPABASE_URL;
        process.env.SUPABASE_SECRET_KEY = "test-key";
        expect(() => getDb()).toThrow("Missing env SUPABASE_URL");

        process.env.SUPABASE_URL = "https://example.supabase.co";
        delete process.env.SUPABASE_SECRET_KEY;
        expect(() => getDb()).toThrow("Missing env SUPABASE_SECRET_KEY");
      } finally {
        process.env.SUPABASE_URL = origUrl;
        process.env.SUPABASE_SECRET_KEY = origKey;
      }
    });
  });

  describe("rolesFor mapping table", () => {
    const mockDbFor = (roles: string[]) => ({
      from: () => ({
        select: () => ({
          eq: async () => ({
            data: roles.map((r) => ({ app_role: r })),
          }),
        }),
      }),
    });

    it("student: receives ['student'], plus 'organiser' if app_roles says so", async () => {
      expect(await rolesFor("stu1", "student", mockDbFor([]) as any)).toEqual(["student"]);
      expect(await rolesFor("stu1", "student", mockDbFor(["organiser"]) as any)).toEqual(["student", "organiser"]);
      expect(await rolesFor("stu1", "student", mockDbFor(["admin", "viewer"]) as any)).toEqual(["student"]);
    });

    it("faculty: receives ['faculty'], plus 'organiser' if app_roles says so", async () => {
      expect(await rolesFor("fac1", "faculty", mockDbFor([]) as any)).toEqual(["faculty"]);
      expect(await rolesFor("fac1", "faculty", mockDbFor(["organiser"]) as any)).toEqual(["faculty", "organiser"]);
      expect(await rolesFor("fac1", "faculty", mockDbFor(["admin"]) as any)).toEqual(["faculty"]);
    });

    it("staff: receives 'admin' ONLY IF app_roles has admin, otherwise no access", async () => {
      expect(await rolesFor("stf1", "staff", mockDbFor([]) as any)).toEqual([]);
      expect(await rolesFor("stf1", "staff", mockDbFor(["admin"]) as any)).toEqual(["admin"]);
      expect(await rolesFor("stf1", "staff", mockDbFor(["organiser", "viewer"]) as any)).toEqual([]);
    });

    it("admin: receives 'admin' ONLY IF app_roles has admin, otherwise no access", async () => {
      expect(await rolesFor("adm1", "admin", mockDbFor([]) as any)).toEqual([]);
      expect(await rolesFor("adm1", "admin", mockDbFor(["admin"]) as any)).toEqual(["admin"]);
    });

    it("hod and director: receive 'viewer' ONLY IF app_roles has viewer, otherwise no access", async () => {
      expect(await rolesFor("hod1", "hod", mockDbFor([]) as any)).toEqual([]);
      expect(await rolesFor("hod1", "hod", mockDbFor(["viewer"]) as any)).toEqual(["viewer"]);
      expect(await rolesFor("dir1", "director", mockDbFor([]) as any)).toEqual([]);
      expect(await rolesFor("dir1", "director", mockDbFor(["viewer"]) as any)).toEqual(["viewer"]);
    });

    it("finance: no access (not an allowed role for this app)", async () => {
      expect(await rolesFor("fin1", "finance", mockDbFor([]) as any)).toEqual([]);
      expect(await rolesFor("fin1", "finance", mockDbFor(["admin", "viewer", "organiser"]) as any)).toEqual([]);
    });

    it("resolveRoles pure function matches the exact same mapping", () => {
      expect(resolveRoles("student", [])).toEqual(["student"]);
      expect(resolveRoles("student", ["organiser"])).toEqual(["student", "organiser"]);
      expect(resolveRoles("faculty", [])).toEqual(["faculty"]);
      expect(resolveRoles("faculty", ["organiser"])).toEqual(["faculty", "organiser"]);
      expect(resolveRoles("staff", [])).toEqual([]);
      expect(resolveRoles("staff", ["admin"])).toEqual(["admin"]);
      expect(resolveRoles("hod", [])).toEqual([]);
      expect(resolveRoles("hod", ["viewer"])).toEqual(["viewer"]);
      expect(resolveRoles("director", ["viewer"])).toEqual(["viewer"]);
      expect(resolveRoles("finance", ["admin", "viewer"])).toEqual([]);
    });
  });

  describe("safeNext open redirect protection", () => {
    it("rejects '//evil.com'", () => {
      expect(safeNext("//evil.com")).toBe("/");
      expect(safeNext("//attacker.com/path")).toBe("/");
    });

    it("rejects '\\'", () => {
      expect(safeNext("\\")).toBe("/");
      expect(safeNext("\\evil.com")).toBe("/");
      expect(safeNext("/path\\evil")).toBe("/");
    });

    it("rejects absolute URLs and protocol-relative attacks", () => {
      expect(safeNext("https://evil.com")).toBe("/");
      expect(safeNext("http://evil.com")).toBe("/");
      expect(safeNext("javascript:alert(1)")).toBe("/");
    });

    it("handles null or undefined input safely", () => {
      expect(safeNext(null)).toBe("/");
      expect(safeNext(undefined)).toBe("/");
    });

    it("allows valid local paths", () => {
      expect(safeNext("/")).toBe("/");
      expect(safeNext("/student")).toBe("/student");
      expect(safeNext("/faculty")).toBe("/faculty");
      expect(safeNext("/admin?tab=roles")).toBe("/admin?tab=roles");
    });
  });
});
