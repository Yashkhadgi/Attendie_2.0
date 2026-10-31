/** Local-only fallback for API + Vite development without a Vercel account. */
import { createServer as createHttpServer } from "node:http";
import { createServer as createViteServer, loadEnv } from "vite";
import login from "../api/dev/login";
import status from "../api/dev/status";
import adminOnly from "../api/dev/admin-only-test";
import me from "../api/auth/me";
import logout from "../api/auth/logout";
import authLogin from "../api/auth/login";
import callback from "../api/auth/callback";
import studentDashboard from "../api/dashboard/student";
import facultyDashboard from "../api/dashboard/faculty";
import adminDashboard from "../api/dashboard/admin";
import organiserDashboard from "../api/dashboard/organiser";
import viewerDashboard from "../api/dashboard/viewer";
import { sendJson, type ApiRequest, type ApiResponse } from "../api/_lib/guard";

if (process.env.NODE_ENV === "production" || (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "development")) {
  throw new Error("The local development server cannot run in a deployment environment");
}
process.env.NODE_ENV = "development";
const localEnv = loadEnv("development", process.cwd(), "");
for (const key of ["APP_SESSION_SECRET"]) {
  if (process.env[key] === undefined && localEnv[key] !== undefined) process.env[key] = localEnv[key];
}
const handlers: Record<string, (req: ApiRequest, res: ApiResponse) => Promise<void>> = {
  "/api/dev/login": login,
  "/api/dev/status": status,
  "/api/dev/admin-only-test": adminOnly,
  "/api/auth/me": me,
  "/api/auth/logout": logout,
  "/api/auth/login": authLogin,
  "/api/auth/callback": callback,
  "/api/dashboard/student": studentDashboard,
  "/api/dashboard/faculty": facultyDashboard,
  "/api/dashboard/admin": adminDashboard,
  "/api/dashboard/organiser": organiserDashboard,
  "/api/dashboard/viewer": viewerDashboard,
};
const server = createHttpServer(async (req: ApiRequest, res: ApiResponse) => {
  let pathname: string;
  try { pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname); }
  catch { sendJson(res, 400, { error: "Invalid request path" }); return; }
  if (pathname.startsWith("/data/") || pathname === "/data" || /\.(xlsx|xls|csv|json)$/i.test(pathname)) {
    sendJson(res, 404, { error: "Not found" }); return;
  }
  if (!pathname.startsWith("/api/")) {
    vite.middlewares(req, res);
    return;
  }
  const handler = handlers[pathname];
  if (!handler) { sendJson(res, 404, { error: "Endpoint not implemented" }); return; }
  try {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 16_384) { sendJson(res, 413, { error: "Request body too large" }); return; }
      chunks.push(Buffer.from(chunk));
    }
    // Preserve the raw JSON body: the same production handler validates/parses it.
    req.body = Buffer.concat(chunks).toString("utf8") || undefined;
    await handler(req, res);
  } catch {
    if (!res.headersSent) sendJson(res, 500, { error: "Local API request failed" });
    else res.end();
  }
});
const vite = await createViteServer({
  server: { middlewareMode: true, ws: { host: "127.0.0.1", server } },
  appType: "spa",
});
const port = Number(process.env.PORT ?? 3001);
server.listen(port, "127.0.0.1", () => console.log(`Attendie local development: http://localhost:${port}`));
async function shutdown() {
  await vite.close();
  server.close(() => process.exit(0));
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
