import type { IncomingMessage, ServerResponse } from "node:http";
import type { AppRole, SessionUser } from "../../src/types";
import { verifySession } from "./session";
import { loadLocalRoster, type PrivateRoster } from "./roster";
import { resolveAccess } from "./access";
import { isLocalDevelopment, isLoopbackRequest } from "./devEnvironment";

export type ApiRequest = IncomingMessage & { body?: unknown; query?: Partial<Record<string, string | string[]>> };
export type ApiResponse = ServerResponse & { status?: (code: number) => ApiResponse; json?: (data: unknown) => ApiResponse };
export function sendJson(res: ApiResponse, code: number, data: unknown) {
  res.setHeader("Cache-Control", "no-store, private");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (res.status && res.json) { res.status(code); res.json(data); return; }
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}
export interface AccessContext { user: SessionUser; roster: PrivateRoster }
export function createAccessGuard(loadRoster: () => Promise<PrivateRoster>) {
 return async function checkAccess(req: ApiRequest, res: ApiResponse, roles?: readonly AppRole[]): Promise<AccessContext | null> {
  const identity = verifySession(req);
  if (!identity) { sendJson(res, 401, { error: "Sign in with EkLink to continue." }); return null; }
  if (!isLocalDevelopment() || !isLoopbackRequest(req)) {
    sendJson(res, 503, { error: "Dashboard data is not available in this environment." }); return null;
  }
  let roster: PrivateRoster;
  try { roster = await loadRoster(); }
  catch { sendJson(res, 503, { error: "College records are temporarily unavailable." }); return null; }
  const user = resolveAccess(identity, roster);
  if (!user || (roles && !roles.includes(user.role))) {
    sendJson(res, 403, { error: "You do not have access to this dashboard." }); return null;
  }
  return { user, roster };
 };
}
export const requireAccess = createAccessGuard(loadLocalRoster);
export async function requireSession(req: ApiRequest, res: ApiResponse, roles?: readonly AppRole[]): Promise<SessionUser | null> {
  return (await requireAccess(req, res, roles))?.user ?? null;
}
