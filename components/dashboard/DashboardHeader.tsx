/**
 * components/dashboard/DashboardHeader.tsx
 * Top bar shown on all dashboard pages.
 * Contains: page title area, language toggle (EN/BM), notification bell, user avatar.
 */
"use client";

import { UserButton } from "@clerk/nextjs";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/components/LanguageProvider";
import type { Lang } from "@/lib/translations";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function DashboardHeader() {
  const { lang, setLang } = useLang();

  return (
    <header className="h-14 border-b border-border/50 bg-background/80 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 flex-shrink-0 z-40">
      {/* Left: spacer on mobile (hamburger is absolutely positioned) */}
      <div className="w-8 lg:hidden" />

      {/* Flex spacer */}
      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Language toggle */}
        <div className="flex items-center rounded-md border border-border overflow-hidden">
          {(["en", "bm"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-2.5 py-1 text-xs font-semibold uppercase transition-colors ${
                lang === l
                  ? "bg-[#00c2cc] text-[#0f1923]" /* ✏️ EDIT: brand accent colour */
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Notification bell — placeholder */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="relative text-muted-foreground hover:text-white"
                aria-label="Notifications"
              />
            }
          >
            <Bell className="h-4 w-4" />
            {/* ✏️ EDIT: Remove this dot when you implement real notifications */}
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#00c2cc]" />
          </TooltipTrigger>
          <TooltipContent>Notifications (coming soon)</TooltipContent>
        </Tooltip>

        {/* Clerk user avatar / account menu */}
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
      </div>
    </header>
  );
}
