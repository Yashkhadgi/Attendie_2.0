import { requireSession, sendJson, type ApiRequest, type ApiResponse } from "../_lib/guard";
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") { sendJson(res, 405, { error: "Method not allowed" }); return; }
  const user = await requireSession(req, res);
  if (user) sendJson(res, 200, { user });
}
