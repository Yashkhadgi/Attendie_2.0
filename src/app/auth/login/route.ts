import { randomBytes } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { required } from "@/lib/env";

export async function GET(_request: NextRequest) {
  const state = randomBytes(32).toString("base64url");
  const url = new URL("/authorize", required("EKLINK_URL"));
  url.searchParams.set("client_id", required("EKLINK_CLIENT_ID"));
  url.searchParams.set("redirect_uri", required("EKLINK_REDIRECT_URI"));
  url.searchParams.set("state", state);
  const res = NextResponse.redirect(url);
  res.cookies.set("eklink_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/auth",
    maxAge: 600,
  });
  return res;
}
