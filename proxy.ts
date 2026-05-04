/**
 * proxy.ts
 * Next.js 16 Proxy (formerly called Middleware).
 * Uses the edge-safe NextAuth config to protect /dashboard routes.
 * The authorized() callback in auth.config.ts handles the redirect to /sign-in.
 */
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export const proxy = auth;

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
