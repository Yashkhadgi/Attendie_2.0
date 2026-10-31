import "server-only";
import { notFound } from "next/navigation";
import { db } from "./people";
import { requireSession } from "./require-session";
import type { Session } from "./session";

export type AppRole = "student" | "faculty" | "organiser" | "admin" | "viewer";

export function resolveRoles(eklinkRole: string, appRoles: string[] = []): AppRole[] {
  const d = new Set(appRoles);
  const roles: AppRole[] = [];
  if (eklinkRole === "student") roles.push("student");
  if (eklinkRole === "faculty") roles.push("faculty");
  if (d.has("organiser") && (eklinkRole === "student" || eklinkRole === "faculty")) roles.push("organiser");
  if (d.has("admin") && (eklinkRole === "staff" || eklinkRole === "admin")) roles.push("admin");
  if (d.has("viewer") && (eklinkRole === "hod" || eklinkRole === "director")) roles.push("viewer");
  return roles;
}

export async function rolesFor(
  login_id: string,
  eklinkRole: string,
  client = db
): Promise<AppRole[]> {
  const { data } = await client.from("app_roles").select("app_role").eq("login_id", login_id);
  const appRoles = (data ?? []).map((r: { app_role: string }) => r.app_role);
  return resolveRoles(eklinkRole, appRoles);
}

/** Use at the top of every protected page / route handler / server action. */
export async function requireRole(path: string, ...allowed: AppRole[]): Promise<{ s: Session; roles: AppRole[] }> {
  const s = await requireSession(path);
  const roles = await rolesFor(s.login_id, s.eklink_role);
  if (roles.length === 0 || (allowed.length > 0 && !allowed.some((r) => roles.includes(r)))) notFound();
  return { s, roles };
}
