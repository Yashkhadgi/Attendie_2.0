import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { rolesFor } from "@/lib/roles";

export async function GET() {
  const s = await getSession();
  if (!s) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roles = await rolesFor(s.login_id, s.eklink_role);
  if (roles.length === 0) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    name: s.name,
    login_id: s.login_id,
    eklink_role: s.eklink_role,
    roles,
  });
}
