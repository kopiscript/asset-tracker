/**
 * proxy.ts
 * Next.js 16 Proxy (formerly called Middleware).
 * Runs on every matching request before the page renders.
 * Protects /dashboard routes so only logged-in users can access them.
 * Clerk handles the redirect to /sign-in automatically.
 *
 * Docs: https://nextjs.org/docs/app/getting-started/proxy
 */
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// All routes under /dashboard require authentication
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

// Export as "proxy" — the new name in Next.js 16
export const proxy = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
