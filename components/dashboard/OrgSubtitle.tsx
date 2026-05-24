"use client";

import { useLang } from "@/components/LanguageProvider";

export function OrgSubtitle({ count }: { count: number }) {
  const { tr, lang } = useLang();
  const word = lang === "bm" ? tr("organisations") : count === 1 ? "organisation" : "organisations";
  return <>{count} {word}</>;
}
