import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PROTECTED_PREFIXES = ["/dashboard", "/designs", "/account", "/problems"];

export default auth((req) => {
  const isProtected = PROTECTED_PREFIXES.some((p) => req.nextUrl.pathname.startsWith(p));
  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/designs/:path*", "/account/:path*", "/problems/:path*"],
};
