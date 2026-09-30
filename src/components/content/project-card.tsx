"use client";

import { CalendarDays, CircleDollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/types/content";
import { useTranslation } from "@/components/i18n/locale-provider";

export function ProjectCard({ project }: { project: Project }) {
  const { locale, t } = useTranslation();
  const duration = project.endYear ? `${project.startYear ?? ""} - ${project.endYear}` : project.startYear;
  const isOngoing = !project.endYear;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
      }}
      className="spotlight-card group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-sm transition-colors duration-500 hover:border-accent/40 hover:shadow-[0_22px_50px_rgba(184,117,24,0.12)]"
    >
      <div className="spotlight-card-glow spotlight-card-glow--accent" aria-hidden="true" />

      <div className="relative z-10 mb-4 flex items-start justify-between gap-3">
        <Badge className="inline-flex items-center gap-1.5">
          {isOngoing && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
          )}
          {project.level ?? t("projectResearch")}
        </Badge>
        {duration ? (
          <span className="inline-flex items-center gap-1 font-mono text-xs text-muted">
            <CalendarDays className="h-4 w-4" aria-hidden="true" /> {duration}
          </span>
        ) : null}
      </div>

      <h3 className="relative z-10 text-lg font-semibold leading-snug text-foreground transition-colors duration-300 group-hover:text-accent">
        {project.title}
      </h3>
      <p className="relative z-10 mt-2 text-sm font-medium text-primary">{t("projectLead", { name: project.leader })}</p>
      {project.abstract ? (
        <p className="relative z-10 mt-3 line-clamp-3 flex-1 text-sm leading-6 text-muted">{project.abstract}</p>
      ) : null}
      {project.budget ? (
        <p className="relative z-10 mt-4 inline-flex items-center gap-1 text-xs font-medium text-muted">
          <CircleDollarSign className="h-4 w-4" aria-hidden="true" /> {project.budget.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")} VND
        </p>
      ) : null}
    </motion.article>
  );
}
