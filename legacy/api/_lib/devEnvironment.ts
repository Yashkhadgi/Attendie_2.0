// DEV-ONLY: replace with EkLink authentication before release.
import type { IncomingMessage } from "node:http";

export function isLocalDevelopment(): boolean {
  return process.env.NODE_ENV === "development"
    && (!process.env.VERCEL_ENV || process.env.VERCEL_ENV === "development");
}

export function isLoopbackRequest(req: IncomingMessage): boolean {
  const host = req.headers.host;
  if (!host || !/^(localhost|127\.0\.0\.1|\[::1\])(?::\d{1,5})?$/.test(host)) return false;
  const peer = req.socket?.remoteAddress;
  return !peer || ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(peer);
}

export function isSameOrigin(req: IncomingMessage): boolean {
  const origin = req.headers.origin;
  // Non-browser local clients do not send Origin; browser requests must match exactly.
  if (!origin) return req.headers["sec-fetch-site"] !== "cross-site";
  return origin === `http://${req.headers.host}` || origin === `https://${req.headers.host}`;
}
