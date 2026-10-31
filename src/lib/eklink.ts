import "server-only";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { required } from "./env";

export type EklinkClaims = {
  sub: string;
  login_id: string;
  email: string;
  name: string;
  role: string;
  department: string | null;
  batch: string | null;
  section: string | null;
  ver: number;
  exp: number;
};

let cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let cachedJwksUrl: string | null = null;

export function getJwks() {
  const currentUrl = `${required("EKLINK_URL")}/.well-known/jwks.json`;
  if (!cachedJwks || cachedJwksUrl !== currentUrl) {
    cachedJwks = createRemoteJWKSet(new URL(currentUrl));
    cachedJwksUrl = currentUrl;
  }
  return cachedJwks;
}

export async function verifyEklinkToken(
  token: string,
  keySet?: Parameters<typeof jwtVerify>[1]
) {
  const issuer = required("EKLINK_ISSUER");
  const audience = required("EKLINK_CLIENT_ID");
  const resolver = keySet ?? getJwks();
  const { payload } = await jwtVerify(token, resolver, {
    issuer,
    audience,
    algorithms: ["ES256"],
    clockTolerance: 10,
  });
  return payload as unknown as EklinkClaims;
}

export async function exchangeCode(code: string) {
  const eklinkUrl = required("EKLINK_URL");
  const redirectUri = required("EKLINK_REDIRECT_URI");
  const clientId = required("EKLINK_CLIENT_ID");
  const clientSecret = required("EKLINK_CLIENT_SECRET");
  const r = await fetch(`${eklinkUrl}/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
    cache: "no-store",
  });
  if (!r.ok) throw new Error("code_exchange_failed");
  return (await r.json()).access_token as string;
}

export async function refreshEklinkToken(oldToken: string) {
  const eklinkUrl = required("EKLINK_URL");
  const clientId = required("EKLINK_CLIENT_ID");
  const clientSecret = required("EKLINK_CLIENT_SECRET");
  const r = await fetch(`${eklinkUrl}/token/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      access_token: oldToken,
    }),
    cache: "no-store",
  });
  return r.ok ? ((await r.json()).access_token as string) : null;
}
