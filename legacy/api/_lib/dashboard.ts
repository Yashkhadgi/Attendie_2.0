import type { AppRole } from "../../src/types";
import type { DashboardData } from "../../src/types/dashboard";
import { requireAccess, sendJson, type AccessContext, type ApiRequest, type ApiResponse } from "./guard";

export function dashboardData(context: AccessContext): DashboardData {
  const { user, roster } = context;
  const person = roster.people.get(user.login_id);
  if (!person) throw new Error("Dashboard identity unavailable");
  return {
    role: user.role,
    profile: { name: person.name, loginId: person.login_id, email: person.email,
      ...(person.role === "student" ? { batch: person.batch, section: person.section, semester: person.semester } : {}) },
    ...(user.role === "ADMIN" || user.role === "VIEWER" ? { roster: roster.summary } : {}),
    availability: { events: false, leaves: false, notifications: false },
  };
}
export function dashboardHandler(role: AppRole, authorize = requireAccess) {
  return async (req: ApiRequest, res: ApiResponse) => {
    if (req.method !== "GET") { sendJson(res, 405, { error: "Method not allowed" }); return; }
    const context = await authorize(req, res, [role]);
    if (!context) return;
    // Identity and role are exclusively session/roster-derived. Reject arbitrary selectors.
    const url = new URL(req.url ?? "/", "http://localhost");
    if ([...url.searchParams].length || (req.query && Object.keys(req.query).length)) {
      sendJson(res, 400, { error: "Dashboard requests do not accept identity selectors." }); return;
    }
    sendJson(res, 200, dashboardData(context));
  };
}
