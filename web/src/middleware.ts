import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(_req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("Referrer-Policy", "no-referrer");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-DNS-Prefetch-Control", "off");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set("Cross-Origin-Resource-Policy", "same-site");
  return res;
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico).*)"],
};
