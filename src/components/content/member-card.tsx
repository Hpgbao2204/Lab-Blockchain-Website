"use client";

import Link from "next/link";
import { ExternalLink, GitBranch, GraduationCap, Globe, Link as LinkIcon } from "lucide-react";
import { motion } from "framer-motion";
import type { Member } from "@/types/content";
import { useTranslation } from "@/components/i18n/locale-provider";

export function MemberCard({ member }: { member: Member }) {
  const { t } = useTranslation();
  const socials = [
    member.links.googleScholar && { href: member.links.googleScholar, label: "Scholar", icon: GraduationCap },
    member.links.orcid && { href: member.links.orcid, label: "ORCID", icon: LinkIcon },
    member.links.webOfScience && { href: member.links.webOfScience, label: "Web of Science", icon: ExternalLink },
    member.links.scopus && { href: member.links.scopus, label: "Scopus", icon: ExternalLink },
    member.links.website && { href: member.links.website, label: "Website", icon: Globe },
    member.links.github && { href: member.links.github, label: "GitHub", icon: GitBranch }
  ].filter(Boolean) as { href: string; label: string; icon: typeof GraduationCap }[];
  const education = member.education.slice(0, 2);
  const achievements = member.achievements.slice(0, 2);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className="group relative h-full overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-sm transition-colors duration-500 hover:border-primary/30 hover:shadow-[0_22px_50px_rgba(8,123,149,0.12)]"
    >
      {/* Top accent that grows on hover */}
      <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-primary to-accent transition-transform duration-500 group-hover:scale-x-100" aria-hidden="true" />

      <div className="flex items-start gap-4">
        <div className="member-avatar-ring relative h-14 w-14 shrink-0 rounded-full p-[2px]">
          <div
            className="grid h-full w-full place-items-center overflow-hidden rounded-full border border-surface bg-primary-soft bg-cover bg-center text-lg font-semibold text-primary"
            style={member.avatar?.url ? { backgroundImage: `url(${member.avatar.url})` } : undefined}
            aria-label={member.name}
          >
            {member.avatar?.url ? null : member.name.slice(0, 1)}
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
            {member.name}
          </h3>
          <p className="text-sm font-medium text-primary">{member.role}</p>
          {typeof member.publicationCount === "number" ? (
            <p className="mt-1 text-xs font-medium text-muted">
              {member.publicationCount === 1 ? t("publicationCountOne") : t("publicationCount", { count: member.publicationCount })}
            </p>
          ) : null}
        </div>
      </div>

      {member.bio ? <p className="mt-4 line-clamp-4 text-sm leading-6 text-muted">{member.bio}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {member.researchInterests.slice(0, 3).map((interest) => (
          <span
            key={interest}
            className="rounded-full border border-border bg-surface-muted px-2.5 py-1 text-xs text-muted transition-colors duration-300 group-hover:border-primary/20 group-hover:text-foreground"
          >
            {interest}
          </span>
        ))}
      </div>

      {education.length ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{t("profileEducation")}</p>
          <ul className="space-y-1 text-sm leading-5 text-muted">
            {education.map((item) => (
              <li key={item} className="line-clamp-2">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {achievements.length ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{t("profileAchievements")}</p>
          <ul className="space-y-1 text-sm leading-5 text-muted">
            {achievements.map((item) => (
              <li key={item} className="line-clamp-2">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {member.hasPublicProfile ? (
        <Link href={`/members/${member.slug}`} className="mt-5 text-sm font-semibold text-primary hover:underline">
          {t("profileView")}
        </Link>
      ) : null}

      {socials.length ? (
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border/60 pt-4 text-sm text-muted">
          {socials.map(({ href, label, icon: Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
            >
              <Icon className="h-4 w-4" aria-hidden="true" /> {label}
              <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" aria-hidden="true" />
            </a>
          ))}
        </div>
      ) : null}
    </motion.article>
  );
}
