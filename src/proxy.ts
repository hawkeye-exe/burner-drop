import { NextResponse } from "next/server";

export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: "/__burner-drop-proxy-never-match__",
};

export * from "./lib/crypto";
export * from "./lib/rateLimit";
