"use client";

import { useSession } from "next-auth/react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/components/LanguageProvider";
import type { Lang } from "@/lib/translations";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function UserAvatar() {
  const { data: session } = useSession();
  const display = session?.user?.name ?? session?.user?.email ?? "?";
  const initials = display
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div
            className="h-8 w-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-xs font-semibold text-primary select-none cursor-default"
            title={session?.user?.email ?? undefined}
          />
        }
      >
        {initials}
      </TooltipTrigger>
      <TooltipContent>{session?.user?.email ?? "Account"}</TooltipContent>
    </Tooltip>
  );
}

export function DashboardHeader() {
  const { lang, setLang } = useLang();

  return (
    <header className="h-14 border-b border-border bg-background/60 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 flex-shrink-0 z-40">
      {/* Mobile hamburger spacer */}
      <div className="w-8 lg:hidden" />

      {/* Flex spacer */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Language toggle — minimal text buttons, no border box */}
        <div className="flex items-center gap-0.5">
          {(["en", "bm"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={[
                "px-2 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-md transition-colors",
                lang === l
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Notification bell */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/5"
                aria-label="Notifications"
              />
            }
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
          </TooltipTrigger>
          <TooltipContent>Notifications — coming soon</TooltipContent>
        </Tooltip>

        {/* User avatar */}
        <UserAvatar />
      </div>
    </header>
  );
}
