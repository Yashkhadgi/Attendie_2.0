import { sendJson, type ApiRequest, type ApiResponse } from "../_lib/guard";
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") { sendJson(res, 405, { error: "Method not allowed" }); return; }
  // Never redirect or mint identities using an unreviewed upstream protocol.
  sendJson(res, 503, { error: "EkLink sign-in is not connected yet. Contact the Attendie administrator." });
}
