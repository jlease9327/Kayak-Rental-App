import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

// Optimistic check only (no JWT verification here — proxy shouldn't do
// slow/async work). The real check lives in src/app/dashboard/layout.tsx,
// close to the data it protects.
export function proxy(request: NextRequest) {
  const hasSession = !!request.cookies.get(SESSION_COOKIE)?.value;

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: "/dashboard/:path*",
};
