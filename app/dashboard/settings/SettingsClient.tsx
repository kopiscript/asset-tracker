"use client";

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

  const initial = ((userName ?? userEmail) || "?")[0].toUpperCase();

  return (
    <div className="max-w-xl">
      <div className="border border-border/50 rounded-xl overflow-hidden divide-y divide-border/40">

        {/* Profile */}
        <div className="p-6">
          <h2 className="text-sm font-semibold text-foreground mb-0.5">{tr("profile")}</h2>
          <p className="text-xs text-muted-foreground mb-5">{tr("profileSubtitle")}</p>
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-primary">{initial}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground leading-none mb-1">
                {userName ?? <span className="italic text-muted-foreground font-normal">{tr("noNameSet")}</span>}
              </p>
              <p className="text-xs text-muted-foreground truncate">{userEmail ?? "—"}</p>
            </div>
          </div>
        </div>

        {/* Language preference */}
        <div className="p-6">
          <h2 className="text-sm font-semibold text-foreground mb-0.5">{tr("language")}</h2>
          <p className="text-xs text-muted-foreground mb-4">{tr("languageSubtitle")}</p>
          <div className="flex gap-2">
            {(["en", "bm"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold border transition-all active:scale-[0.98] ${
                  lang === l
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                {l === "en" ? "English" : "Bahasa Malaysia"}
              </button>
            ))}
          </div>
        </div>

        {/* Support */}
        <div className="p-6">
          <h2 className="text-sm font-semibold text-foreground mb-0.5">{tr("support")}</h2>
          <p className="text-sm text-muted-foreground">
            {tr("needHelpContact")}{" "}
            <a
              href={`mailto:${supportEmail}`}
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              {supportEmail}
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
