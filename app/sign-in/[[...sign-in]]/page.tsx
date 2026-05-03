/**
 * app/sign-in/[[...sign-in]]/page.tsx
 * Clerk-managed sign-in page. The [[...sign-in]] catch-all folder name is
 * required by Clerk so it can handle multi-step auth flows (SSO, MFA, etc.).
 */
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {/* Clerk renders a fully styled sign-in form automatically */}
      <SignIn />
    </div>
  );
}
