/**
 * app/dashboard/settings/page.tsx
 * User account settings page.
 * Shows profile info (from NextAuth session), language toggle, and support.
 */
import { auth } from "@/auth";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const session = await auth();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>

      <SettingsClient
        userName={session?.user?.name ?? null}
        userEmail={session?.user?.email ?? null}
        // ✏️ EDIT: Replace with your support email address
        supportEmail="support@yourcompany.com"
      />
    </div>
  );
}
