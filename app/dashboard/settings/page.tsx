/**
 * app/dashboard/settings/page.tsx
 * User account settings page.
 * Shows profile info (from Clerk), language toggle, and appearance settings.
 */
import { currentUser } from "@clerk/nextjs/server";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const user = await currentUser();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>

      <SettingsClient
        userName={
          user
            ? [user.firstName, user.lastName].filter(Boolean).join(" ") || null
            : null
        }
        userEmail={user?.emailAddresses[0]?.emailAddress ?? null}
        // ✏️ EDIT: Replace with your support email address
        supportEmail="support@yourcompany.com"
      />
    </div>
  );
}
