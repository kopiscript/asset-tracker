/**
 * proxy.ts
 * Next.js 16 Proxy (formerly called Middleware).
 * Uses the edge-safe NextAuth config to protect /dashboard routes.
 * The authorized() callback in auth.config.ts handles the redirect to /sign-in.
 *
 * Also stamps the current pathname onto a request header (x-current-path) so
 * server layouts can read the active route — used by the dashboard layout to
 * avoid redirect loops on /dashboard/welcome.
 */
import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export const proxy = auth((req: NextRequest & { auth: unknown }) => {
  // NextAuth's authorized() callback has already run and may have set a redirect.
  // We only add a header for normal pass-through requests.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-current-path", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
