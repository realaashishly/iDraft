// middleware.ts

// --- IMPORTANT ---
// Assuming 'getSessionCookie' returns a valid session object (with user info)
// if the user is authenticated, and null/undefined otherwise.
// If it ONLY returns the cookie value, this middleware might not be secure
// enough, and you might need a different function from better-auth
// that validates the session server-side.
import { getSessionCookie } from "better-auth/cookies"; // Verify this function's return value
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// NOTE: Middleware often runs on the Edge runtime by default.
// Explicitly setting 'nodejs' is fine if you need Node.js APIs, otherwise optional.
export const runtime = "nodejs";

export async function middleware(request: NextRequest) {
  // Consider making async if getSessionCookie is async
  const { pathname } = request.nextUrl;

  // 1. Define public paths (use startsWith for broader matching)
  //    Make sure to include necessary API routes for auth!
  const publicPaths = ["/login", "/signup", "/api/auth", "/api/uploadthing"]; // Added /api/auth
  // Decide if '/' should be public or protected. If protected, remove it.
  // const isRoot = pathname === '/';

  // Check if the current path starts with any of the public paths
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // 2. Get the session state
  const session = await getSessionCookie(request); // Use await if the function returns a Promise

  // 3. Redirect logic: If trying to access a PROTECTED route WITHOUT a session
  //    (Assuming '/' is protected unless explicitly added to publicPaths)
  if (!(isPublicPath || session)) {
    // Check if session is falsy (null, undefined, etc.)
    // if (!isPublicPath && !session && !isRoot) { // Alternative if '/' is public
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname); // Add callback for redirection after login
    return NextResponse.redirect(loginUrl);
  }

  // 4. Redirect logic: If trying to access LOGIN or SIGNUP pages WHILE LOGGED IN
  if (session && (pathname === "/login" || pathname === "/signup")) {
    // Redirect logged-in users away from login/signup to a default authenticated page
    return NextResponse.redirect(new URL("/dashboard", request.url)); // Redirect to dashboard or home
  }

  // 5. Allow the request to proceed
  return NextResponse.next();
}

// 6. Refined Matcher: Excludes specific assets and API routes more carefully
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Specific public assets (png, svg etc.)
     * - /api/auth routes (handled by the publicPaths check) - Optional to exclude here too
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    // Removed 'api' exclusion to ensure middleware runs on other potential API routes
    // unless you specifically want to exclude ALL /api/* routes.
    // If you want to exclude all API routes except auth:
    // '/((?!api/|api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
