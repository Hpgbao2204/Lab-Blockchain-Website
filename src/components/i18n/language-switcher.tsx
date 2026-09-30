"use client";

import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/i18n/locale-provider";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useTranslation();
  const next = locale === "en" ? "vi" : "en";

  return <button type="button" onClick={() => setLocale(next)} title={next === "vi" ? "Chuyển sang tiếng Việt" : "Switch to English"} aria-label={next === "vi" ? "Chuyển sang tiếng Việt" : "Switch to English"} className={cn("inline-flex h-11 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary/30", className)}><Languages className="h-4 w-4 text-primary" aria-hidden="true" />{locale === "en" ? "VI" : "EN"}</button>;
}
