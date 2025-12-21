import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyTokenEdge } from "./lib/auth/utils";

const ACCESS_COOKIE_NAME = process.env.ACCESS_COOKIE_NAME || "";
const ACCESS_COOKIE_VALUE = process.env.ACCESS_COOKIE_VALUE || "";
const AUTH_TOKEN_NAME = process.env.AUTH_TOKEN_NAME || "";
const EARLY_ACCESS_DISABLED =
  process.env.EARLY_ACCESS_DISABLE?.toLowerCase() === "true";
const AUTH_ENABLED = process.env.AUTH_ENABLED?.toLowerCase() !== "false"; // Default to enabled

const PUBLIC_PATHS = new Set<string>([
  "/",
  "/early-access",
  "/login",
  "/signup",
]);

const PUBLIC_FILE = /\.(.*)$/;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files and Next.js internals
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

  // Allow public paths
  if (PUBLIC_PATHS.has(pathname) || pathname.startsWith("/early-access")) {
    return NextResponse.next();
  }

  // If auth is enabled, check for user authentication
  if (AUTH_ENABLED) {
    const authToken = request.cookies.get(AUTH_TOKEN_NAME)?.value;

    if (authToken) {
      // Use Edge-compatible token verification
      const decoded = await verifyTokenEdge(authToken);
      if (decoded) {
        // User is authenticated
        return NextResponse.next();
      } else {
        // Token exists but is invalid - log for debugging
        console.warn("[Middleware] Invalid token detected for path:", pathname);
      }
    } else {
      // No token found - log for debugging
      console.warn("[Middleware] No auth token found for path:", pathname);
    }

    // Not authenticated, redirect to login
    // Normalize pathname to fix any typos (e.g., /workspace -> /workspace)
    const normalizedPath = pathname.replace(/^\/workspace$/, "/workspace");
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", normalizedPath);
    return NextResponse.redirect(redirectUrl);
  }

  // Fallback to early access system if auth is disabled
  if (EARLY_ACCESS_DISABLED) {
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
