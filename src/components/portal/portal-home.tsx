"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/components/i18n/locale-provider";

export function PortalHome() {
  const { t } = useTranslation();

  const destinations = [
    {
      href: "/portal/profile",
      title: t("portalHomeProfileTitle"),
      description: t("portalHomeProfileDescription"),
    },
    {
      href: "/portal/walls",
      title: t("portalHomeWallsTitle"),
      description: t("portalHomeWallsDescription"),
    },
  ];

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-12">
      <div className="max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-primary">
          Blockchainist
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
          {t("portalHomeTitle")}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
          {t("portalHomeDescription")}
        </p>
      </div>

      <nav className="mt-8 grid gap-4 md:grid-cols-2" aria-label={t("portalHomeNavigation")}>
        {destinations.map((destination) => (
          <Link
            key={destination.href}
            href={destination.href}
            className="group rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Card className="h-full p-6 transition-colors group-hover:bg-surface-muted">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {destination.title}
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-6 text-muted">
                    {destination.description}
                  </p>
                </div>
                <ArrowRight
                  className="mt-0.5 h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </div>
            </Card>
          </Link>
        ))}
      </nav>
    </section>
  );
}
