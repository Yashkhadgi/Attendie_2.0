import { sendJson, type ApiRequest, type ApiResponse } from "../_lib/guard";
export default async function handler(_req: ApiRequest, res: ApiResponse) {
  sendJson(res, 404, { error: "Not found" });
}
