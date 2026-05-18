import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: { id: string; usertype: string } & DefaultSession["user"];
  }
  interface User {
    usertype?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    usertype?: string;
  }
}
