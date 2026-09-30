import Link from "next/link";
import {
  Award,
  BookOpen,
  ExternalLink,
  FileText,
  FolderKanban,
  GraduationCap,
  Link2,
  Quote
} from "lucide-react";
import type { Member, Project, Publication } from "@/types/content";
import type { Locale } from "@/lib/i18n";
import { translate } from "@/lib/i18n";

type PublicProfileProps = {
  member: Member;
  publications: Publication[];
  projects: Project[];
  locale: Locale;
};

type AcademicLink = { label: string; href: string };

function copy(locale: Locale) {
  return locale === "vi"
    ? {
        back: "Blockchainist Research Team",
        portfolio: "Portfolio học thuật",
        academicLinks: "Liên kết học thuật",
        visitCv: "Xem CV học thuật",
        profilePending: "Hồ sơ đang được cập nhật",
        profilePendingDescription: "Thành viên này chưa chia sẻ thêm thông tin học thuật công khai.",
        projectLead: "Chủ trì",
        ongoing: "Đang thực hiện",
        completed: "Đã hoàn thành",
        open: "Đang mở"
      }
    : {
        back: "Blockchainist Research Team",
        portfolio: "Academic portfolio",
        academicLinks: "Academic links",
        visitCv: "View academic CV",
        profilePending: "Profile in progress",
        profilePendingDescription: "This member has not shared additional public academic information yet.",
        projectLead: "Lead",
        ongoing: "Ongoing",
        completed: "Completed",
        open: "Open"
      };
}

function projectStatus(status: Project["status"], locale: Locale) {
  const labels = copy(locale);
  return status === "completed" ? labels.completed : status === "open" ? labels.open : labels.ongoing;
}

function ProfileSection({
  icon: Icon,
  title,
  children
}: {
  icon: typeof BookOpen;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border pt-7">
      <div className="flex items-center gap-2 text-primary">
        <Icon className="h-4 w-4" aria-hidden="true" />
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ExternalProfileLink({ link }: { link: AcademicLink }) {
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center justify-between gap-3 border-b border-border py-3 text-sm font-medium text-foreground transition-colors hover:text-primary"
    >
      <span>{link.label}</span>
      <ExternalLink className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
    </a>
  );
}

export function PublicProfile({ member, publications, projects, locale }: PublicProfileProps) {
  const labels = copy(locale);
  const academicLinks: AcademicLink[] = [
    member.links.googleScholar && { label: "Google Scholar", href: member.links.googleScholar },
    member.links.orcid && { label: "ORCID", href: member.links.orcid },
    member.links.webOfScience && { label: "Web of Science", href: member.links.webOfScience },
    member.links.scopus && { label: "Scopus", href: member.links.scopus },
    member.links.website && { label: "Website", href: member.links.website },
    member.links.github && { label: "GitHub", href: member.links.github }
  ].filter((link): link is AcademicLink => Boolean(link));
  const hasPortfolioContent = Boolean(
    member.bio ||
      member.researchInterests.length ||
      member.education.length ||
      member.achievements.length ||
      member.cvUrl ||
      academicLinks.length ||
      publications.length ||
      projects.length
  );

  return (
    <section>
      <header className="border-b border-border bg-surface-muted/60">
        <div className="mx-auto max-w-6xl px-6 pb-10 pt-8 sm:px-8 lg:px-10">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            <Link2 className="h-4 w-4" />
            {labels.back}
          </Link>
          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-end">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
              <div
                className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-surface bg-primary-soft bg-cover bg-center text-4xl font-semibold text-primary shadow-sm"
                style={member.avatar?.url ? { backgroundImage: `url(${member.avatar.url})` } : undefined}
                aria-label={member.avatar?.url ? member.avatar.alt : member.name}
              >
                {member.avatar?.url ? null : member.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-primary">{labels.portfolio}</p>
                <h1 className="mt-3 break-words text-4xl font-semibold text-foreground sm:text-5xl">{member.name}</h1>
                <p className="mt-3 text-base text-muted">{member.role}</p>
              </div>
            </div>
            {academicLinks.length ? (
              <div className="border-l-2 border-accent pl-4">
                <p className="text-sm font-semibold text-foreground">{labels.academicLinks}</p>
                <p className="mt-1 text-sm leading-6 text-muted">{academicLinks.map((link) => link.label).join(" · ")}</p>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:px-10 lg:py-14">
        <main className="min-w-0 space-y-10">
          {!hasPortfolioContent ? (
            <section className="border-y border-border py-12">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-primary">{translate(locale, "profileResearchProfile")}</p>
              <h2 className="mt-3 text-2xl font-semibold text-foreground">{labels.profilePending}</h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-muted">{labels.profilePendingDescription}</p>
            </section>
          ) : null}

          {member.bio ? (
            <ProfileSection icon={Quote} title={translate(locale, "profileAbout")}>
              <p className="max-w-3xl whitespace-pre-line text-base leading-8 text-foreground">{member.bio}</p>
            </ProfileSection>
          ) : null}

          {member.researchInterests.length ? (
            <ProfileSection icon={BookOpen} title={translate(locale, "profileResearchInterests")}>
              <div className="flex flex-wrap gap-2">
                {member.researchInterests.map((interest) => (
                  <span key={interest} className="rounded-full border border-primary/20 bg-primary-soft px-3 py-1.5 text-sm font-medium text-primary">
                    {interest}
                  </span>
                ))}
              </div>
            </ProfileSection>
          ) : null}

          {publications.length ? (
            <ProfileSection icon={BookOpen} title={translate(locale, "profileSelectedPublications")}>
              <div>
                {publications.map((publication) => (
                  <article key={publication.id} className="border-b border-border py-5 first:pt-0 last:border-b-0 last:pb-0">
                    <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-primary">{publication.year ?? "N/A"}{publication.type ? ` · ${publication.type}` : ""}</p>
                    <h3 className="mt-2 text-xl font-semibold leading-7 text-foreground">
                      {publication.url ? <a href={publication.url} target="_blank" rel="noreferrer" className="hover:text-primary hover:underline">{publication.title}</a> : publication.title}
                    </h3>
                    {publication.authors.length ? <p className="mt-2 text-sm leading-6 text-muted">{publication.authors.join(", ")}</p> : null}
                    {publication.venue ? <p className="mt-2 text-sm font-medium text-primary">{publication.venue}</p> : null}
                  </article>
                ))}
              </div>
            </ProfileSection>
          ) : null}

          {projects.length ? (
            <ProfileSection icon={FolderKanban} title={translate(locale, "profileSelectedProjects")}>
              <div className="grid gap-4 sm:grid-cols-2">
                {projects.map((project) => (
                  <article key={project.id} className="flex min-h-44 flex-col border border-border bg-surface p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold leading-6 text-foreground">{project.title}</h3>
                      {project.status ? <span className="shrink-0 text-xs font-semibold text-primary">{projectStatus(project.status, locale)}</span> : null}
                    </div>
                    {project.description ? <p className="mt-3 text-sm leading-6 text-muted">{project.description}</p> : null}
                    <p className="mt-auto pt-5 text-sm text-muted">{labels.projectLead}: {project.leader}</p>
                  </article>
                ))}
              </div>
            </ProfileSection>
          ) : null}
        </main>

        <aside className="grid content-start gap-7">
          {academicLinks.length ? (
            <section className="border-t border-border pt-7">
              <div className="flex items-center gap-2 text-primary"><Link2 className="h-4 w-4" /><h2 className="text-base font-semibold text-foreground">{labels.academicLinks}</h2></div>
              <div className="mt-2">{academicLinks.map((link) => <ExternalProfileLink key={link.label} link={link} />)}</div>
            </section>
          ) : null}

          {member.cvUrl ? (
            <section className="border-t border-border pt-7">
              <a href={member.cvUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                <FileText className="h-4 w-4" />
                {labels.visitCv}
              </a>
            </section>
          ) : null}

          {member.education.length ? (
            <ProfileSection icon={GraduationCap} title={translate(locale, "profileEducation")}>
              <ul className="grid gap-3 text-sm leading-6 text-muted">{member.education.map((item) => <li key={item}>{item}</li>)}</ul>
            </ProfileSection>
          ) : null}

          {member.achievements.length ? (
            <ProfileSection icon={Award} title={translate(locale, "profileAchievements")}>
              <ul className="grid gap-3 text-sm leading-6 text-muted">{member.achievements.map((item) => <li key={item}>{item}</li>)}</ul>
            </ProfileSection>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
