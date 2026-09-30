"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useTranslation } from "@/components/i18n/locale-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getFirebaseClientAuth } from "@/lib/firebase/client";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const isPortal = pathname.startsWith("/portal");

  const navigation = [
    { href: "/#research", label: t("navResearch") },
    { href: "/#publications", label: t("navPublications") },
    { href: "/#members", label: t("navContributors") },
    { href: "/#join", label: t("navJoin") },
  ];

  useEffect(() => {
    const auth = getFirebaseClientAuth();
    if (!auth) return;
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    const auth = getFirebaseClientAuth();
    if (!auth) return;

    setSigningOut(true);
    try {
      await signOut(auth);
      router.replace("/portal");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-[73px] max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">
        <Link href="/" aria-label="Blockchainist home" className="shrink-0">
          <Image
            src="/logo.png"
            alt="Blockchainist Research Team"
            width={136}
            height={42}
            priority
            style={{ height: 38, width: "auto" }}
          />
        </Link>

        {!isPortal ? (
          <nav className="hidden items-center rounded-full border border-border bg-surface p-1 shadow-sm lg:flex" aria-label="Primary navigation">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : (
          <div className="hidden flex-1 lg:block" aria-hidden="true" />
        )}

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
          {!isPortal ? (
            <Link
              href="/portal"
              className="hidden min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:inline-flex"
            >
              Portal
            </Link>
          ) : null}
          {user ? (
            <button
              type="button"
              onClick={() => void handleSignOut()}
              disabled={signingOut}
              className={`${isPortal ? "inline-flex" : "hidden sm:inline-flex"} min-h-10 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted disabled:pointer-events-none disabled:opacity-50`}
              aria-label={t("portalSignOut")}
              title={t("portalSignOut")}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden md:inline">{t("portalSignOut")}</span>
            </button>
          ) : isPortal ? (
            <Link
              href="/portal/profile"
              className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("portalSignIn")}
            </Link>
          ) : null}
          {!isPortal ? (
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-surface-muted lg:hidden"
              aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          ) : null}
        </div>
      </div>

      {!isPortal && menuOpen ? (
        <nav className="border-t border-border bg-background px-5 py-3 lg:hidden" aria-label="Mobile navigation">
          <div className="mx-auto grid max-w-7xl gap-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/portal"
              className="mt-1 rounded-md border border-border px-3 py-3 text-sm font-semibold text-primary transition-colors hover:bg-surface-muted sm:hidden"
            >
              Portal
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
