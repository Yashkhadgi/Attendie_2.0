import type { AppRole, SessionUser } from "../../src/types";
import type { PrivateRoster } from "./roster";
import type { VerifiedSession } from "./session";

export function resolveAccess(identity: VerifiedSession, roster: PrivateRoster): SessionUser | null {
  const person = roster.people.get(identity.login_id);
  if (!person || person.role !== identity.eklink_role) return null;
  const grant = roster.grants.get(person.login_id);
  let role: AppRole | null = null;
  if (grant === "admin" && ["staff", "admin"].includes(person.role)) role = "ADMIN";
  else if (grant === "viewer" && ["hod", "director"].includes(person.role)) role = "VIEWER";
  else if (person.role === "faculty" && (!grant || grant === "organiser")) role = "FACULTY";
  else if (person.role === "student" && !grant) role = "STUDENT";
  else if (person.role === "student" && grant === "organiser") role = "ORGANISER";
  if (!role) return null;
  return { login_id: person.login_id, name: person.name, email: person.email, role };
}
