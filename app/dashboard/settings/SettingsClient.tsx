/**
 * app/dashboard/settings/SettingsClient.tsx
 * Client component for the settings page.
 * Handles language selection, and shows profile info.
 */
"use client";

import { UserProfile } from "@clerk/nextjs";
import { useLang } from "@/components/LanguageProvider";
import type { Lang } from "@/lib/translations";

interface SettingsClientProps {
  userName: string | null;
  userEmail: string | null;
  supportEmail: string;
}

export function SettingsClient({
  userName,
  userEmail,
  supportEmail,
}: SettingsClientProps) {
  const { lang, setLang, tr } = useLang();

  return (
    <div className="max-w-2xl space-y-6">
      {/* Language preference */}
      <div className="bg-card border border-border/50 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-1">
          {tr("language")}
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Choose the display language for the dashboard.
        </p>

        <div className="flex gap-2">
          {(["en", "bm"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold border transition-all ${
                lang === l
                  ? "bg-[#00c2cc] text-[#0f1923] border-[#00c2cc]"
                  : "border-border/50 text-muted-foreground hover:text-white hover:border-border"
              }`}
            >
              {l === "en" ? "English" : "Bahasa Malaysia"}
            </button>
          ))}
        </div>
      </div>

      {/* Profile section */}
      <div className="bg-card border border-border/50 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-1">Profile</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Your profile is managed by Clerk. Click below to edit your name,
          email, or password.
        </p>
        <div className="text-sm text-muted-foreground mb-3">
          <p>
            <span className="text-white">Name:</span> {userName ?? "Not set"}
          </p>
          <p>
            <span className="text-white">Email:</span> {userEmail ?? "Unknown"}
          </p>
        </div>
        {/* Clerk's built-in profile management UI */}
        <UserProfile routing="hash" />
      </div>

      {/* Support section */}
      <div className="bg-card border border-border/50 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-1">Support</h2>
        <p className="text-sm text-muted-foreground">
          Need help? Contact us at{" "}
          <a
            href={`mailto:${supportEmail}`}
            className="text-[#00c2cc] hover:underline"
          >
            {/* ✏️ EDIT: Replace with your support email */}
            {supportEmail}
          </a>
        </p>
      </div>
    </div>
  );
}
