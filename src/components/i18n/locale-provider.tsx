"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { translate, type Locale, type TranslateValues } from "@/lib/i18n";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: Parameters<typeof translate>[1], values?: TranslateValues) => string;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: "vi",
  setLocale: () => undefined,
  t: (key, values) => translate("vi", key, values)
});

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState(initialLocale);
  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale(next) {
      document.cookie = `locale=${next}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = next;
      setLocaleState(next);
      router.refresh();
    },
    t: (key, values) => translate(locale, key, values)
  }), [locale, router]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useTranslation() {
  return useContext(LocaleContext);
}
