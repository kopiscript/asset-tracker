/**
 * components/LanguageProvider.tsx
 * React context that stores the current language (EN or BM) and exposes
 * a toggle function. Language preference is saved to localStorage so it
 * persists across page loads.
 *
 * Wrap your dashboard layout with <LanguageProvider> to enable translations.
 */
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { t, type Lang } from "@/lib/translations";

type LanguageContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Shorthand: tr("addVehicle") returns the translated string */
  tr: (key: keyof (typeof t)["en"]) => string;
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  tr: (key) => t.en[key],
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // Load saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem("fleet-lang") as Lang | null;
    if (saved === "en" || saved === "bm") setLangState(saved);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("fleet-lang", l);
  }

  function tr(key: keyof (typeof t)["en"]): string {
    return t[lang][key] as string;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, tr }}>
      {children}
    </LanguageContext.Provider>
  );
}

/** Hook to access the current language and translation function */
export function useLang() {
  return useContext(LanguageContext);
}
