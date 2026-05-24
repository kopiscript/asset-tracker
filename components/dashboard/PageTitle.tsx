"use client";

import { useLang } from "@/components/LanguageProvider";
import type { TranslationKey } from "@/lib/translations";

export function PageTitle({ k }: { k: TranslationKey }) {
  const { tr } = useLang();
  return <>{tr(k)}</>;
}
