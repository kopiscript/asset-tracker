"use client";

import { useLang } from "@/components/LanguageProvider";

export function VehiclesCountSubtitle({ count }: { count: number }) {
  const { tr, lang } = useLang();
  const word = lang === "bm" ? tr("vehicles") : count === 1 ? "vehicle" : "vehicles";
  return <>{count} {word} {tr("total")}</>;
}
