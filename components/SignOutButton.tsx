"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

/**
 * Real sign-out action — clears the NextAuth session and lands on /sign-in.
 *
 * Used on the billing gate pages (/billing/activate, /billing/lapsed), which
 * sit outside /dashboard and so have no sidebar sign-out. Without this, an
 * unpaid owner is trapped: the dashboard plan gate keeps redirecting them back
 * here, and a plain link to /sign-in doesn't drop the existing session.
 */
export function SignOutButton({
  className = "",
  label = "Sign out",
  withIcon = false,
}: {
  className?: string;
  label?: string;
  withIcon?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/sign-in" })}
      className={className}
    >
      {withIcon && <LogOut className="h-4 w-4 shrink-0" />}
      {label}
    </button>
  );
}
