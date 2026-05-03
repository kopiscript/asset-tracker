/**
 * app/sign-up/[[...sign-up]]/page.tsx
 * Clerk-managed sign-up page. The [[...sign-up]] catch-all folder name is
 * required by Clerk so it can handle email verification steps, etc.
 */
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {/* Clerk renders a fully styled sign-up form automatically */}
      <SignUp />
    </div>
  );
}
