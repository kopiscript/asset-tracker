"use client";

import { useLang } from "@/components/LanguageProvider";

export function PercentOfFleet({ percent }: { percent: number }) {
  const { tr } = useLang();
  return (
    <>
      {percent}% {tr("ofFleet")}
    </>
  );
}
