import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("alphalift_token")?.value;
  const { pathname } = request.nextUrl;

  // Define paths that are always public
  const isLoginPage = pathname === "/login";
  const isStaticFile =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") || // e.g. favicon.ico, images, etc.
    pathname.startsWith("/api"); // Exclude API routes if any

  if (isStaticFile) {
    return NextResponse.next();
  }

  // If user is on login page and already has a token, redirect to dashboard
  if (isLoginPage && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If user is not on login page and has no token, redirect to login
  if (!isLoginPage && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// Config to specify matching paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - GymLogo.png (logo)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|GymLogo.png).*)",
  ],
};
