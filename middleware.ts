import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ACCESS_COOKIE_NAME = "helix-access";
const ACCESS_COOKIE_VALUE = "granted";
const EARLY_ACCESS_DISABLED =
  process.env.EARLY_ACCESS_DISABLE?.toLowerCase() === "true";

const PUBLIC_PATHS = new Set<string>(["/", "/early-access"]);

const PUBLIC_FILE = /\.(.*)$/;

export function middleware(request: NextRequest) {
  if (EARLY_ACCESS_DISABLED) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/assets") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/manifest.json" ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.has(pathname) || pathname.startsWith("/early-access")) {
    return NextResponse.next();
  }

  const hasBypassCookie =
    request.cookies.get(ACCESS_COOKIE_NAME)?.value === ACCESS_COOKIE_VALUE;

  if (hasBypassCookie) {
    return NextResponse.next();
  }

  const redirectUrl = new URL("/early-access", request.url);
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
