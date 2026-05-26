/**
 * app/dashboard/settings/page.tsx
 * User account settings page.
 * Shows profile info (from NextAuth session), language toggle, and support.
 */
import { auth } from "@/auth";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { SettingsClient } from "./SettingsClient";


export default async function SettingsPage() {
  const session = await auth();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground leading-none tracking-tight"><PageTitle k="settings" /></h1>
        <p className="text-sm text-muted-foreground mt-1">
          <PageTitle k="settingsSubtitle" />
        </p>
      </div>

      <SettingsClient
        userName={session?.user?.name ?? null}
        userEmail={session?.user?.email ?? null}
        supportEmail={process.env.SUPPORT_EMAIL ?? "support@miraefleet.app"}
      />
    </div>
  );
}
