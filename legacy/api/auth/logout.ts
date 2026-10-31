// DEV-ONLY: delete in Phase 6 (EkLink R1)
import type { ApiRequest, ApiResponse } from "../_lib/guard";
import { sendJson } from "../_lib/guard";
import { clearSessionCookie } from "../_lib/session";
import { isSameOrigin } from "../_lib/devEnvironment";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  if (!isSameOrigin(req)) {
    sendJson(res, 403, { error: "Origin is not allowed" });
    return;
  }

  const cookieHeader = clearSessionCookie();
  res.setHeader("Set-Cookie", cookieHeader);
  sendJson(res, 200, { success: true });
}
