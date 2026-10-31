import { sendJson, type ApiRequest, type ApiResponse } from "../_lib/guard";
export default async function handler(_req: ApiRequest, res: ApiResponse) {
  sendJson(res, 503, { error: "EkLink sign-in is not connected yet." });
}
