import { type NextRequest, NextResponse } from "next/server";
import { required } from "@/lib/env";

const PUBLIC = ["/auth", "/_next", "/favicon.ico"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }
  if (!request.cookies.get("attendie_session")) {
    if (pathname === "/api" || pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/auth/login", required("APP_URL")));
  }
  return NextResponse.next();
}

export default proxy;
export { proxy as middleware };
