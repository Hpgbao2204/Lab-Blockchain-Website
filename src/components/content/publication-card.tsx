"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Publication } from "@/types/content";
import { useTranslation } from "@/components/i18n/locale-provider";

const cardClassName =
  "spotlight-card group relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all duration-400 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_44px_rgba(8,123,149,0.1)]";

export function PublicationCard({ publication }: { publication: Publication }) {
  const { t } = useTranslation();
  const updateSpotlight = (event: React.MouseEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--spot-x", `${event.clientX - bounds.left}px`);
    event.currentTarget.style.setProperty("--spot-y", `${event.clientY - bounds.top}px`);
  };

  const content = (
    <>
      <div className="spotlight-card-glow" aria-hidden="true" />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <Badge>{publication.type ?? t("publicationsEyebrow")}</Badge>
        <span className="font-mono text-sm text-muted">{publication.year ?? "N/A"}</span>
      </div>

      <div className="relative z-10 space-y-2">
        <h3 className="text-lg font-semibold leading-snug text-foreground transition-colors duration-300 group-hover:text-primary">
          {publication.title}
        </h3>
        <p className="text-sm text-muted">{publication.authors.join(", ") || t("publicationAuthorsPending")}</p>
        {publication.venue ? <p className="text-sm font-medium text-primary">{publication.venue}</p> : null}
      </div>

      <div className="relative z-10 mt-auto flex items-center justify-between gap-3 border-t border-border/60 pt-4">
        {publication.doi ? (
          <span className="truncate font-mono text-xs text-muted">{publication.doi}</span>
        ) : (
          <span />
        )}
        {publication.url ? (
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary transition-all group-hover:gap-1.5">
            {t("publicationView")} <ExternalLink className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        ) : null}
      </div>
    </>
  );

  if (publication.url) {
    return (
      <motion.a
        href={publication.url}
        target="_blank"
        rel="noreferrer"
        aria-label={`${t("publicationView")} ${publication.title}`}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        onMouseMove={updateSpotlight}
        className={cardClassName}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={updateSpotlight}
      className={cardClassName}
    >
      {content}
    </motion.article>
  );
}
