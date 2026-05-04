/**
 * auth.config.ts
 * Edge-safe NextAuth config — imported by proxy.ts (middleware).
 * Must NOT import prisma, bcryptjs, or any Node.js-only module.
 */
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      if (nextUrl.pathname.startsWith("/dashboard")) {
        return isLoggedIn; // redirect to /sign-in when false
      }
      return true;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
};
