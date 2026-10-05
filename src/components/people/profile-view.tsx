import { ArrowUpRight, Award, BookOpen, Briefcase, FolderGit2, GraduationCap } from "lucide-react";
import type { CvEntry } from "@/server/db/schema";
import { Avatar } from "./avatar";

export { Avatar };
import type { PersonView } from "@/server/services/people";

const SECTIONS = [
  { key: "education", title: "Education", icon: GraduationCap },
  { key: "experience", title: "Research & experience", icon: Briefcase },
  { key: "projects", title: "Projects", icon: FolderGit2 },
  { key: "awards", title: "Awards", icon: Award },
] as const;

export const accentVar = (accent: string) => `var(--color-${/^[a-z]+$/.test(accent) ? accent : "yellow"})`;

function Entries({ items }: { items: CvEntry[] }) {
  return (
    <ol className="cv-list">
      {items.map((e, i) => (
        <li key={i}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <h4 className="font-bold">
              {e.url ? (
                <a href={e.url} target="_blank" rel="noopener noreferrer" className="underline">
                  {e.title}
                </a>
              ) : (
                e.title
              )}
            </h4>
            {e.period && <span className="mono text-xs text-muted">{e.period}</span>}
          </div>
          {e.org && <p className="text-sm text-ink-2">{e.org}</p>}
          {e.detail && <p className="mt-1 whitespace-pre-line text-sm text-ink-2">{e.detail}</p>}
        </li>
      ))}
    </ol>
  );
}

function Links({ person }: { person: PersonView }) {
  return (
    <div className="flex flex-wrap gap-2">
      {person.portfolioUrl && (
        <a href={person.portfolioUrl} className="btn btn-sm btn-ink" target="_blank" rel="noopener noreferrer">
          Website <ArrowUpRight size={14} aria-hidden />
        </a>
      )}
      {person.links.map((l) => (
        <a key={l.url} href={l.url} className="btn btn-sm" target="_blank" rel="noopener noreferrer">
          {l.label} <ArrowUpRight size={14} aria-hidden />
        </a>
      ))}
    </div>
  );
}

function Sections({ person }: { person: PersonView }) {
  const filled = SECTIONS.filter((s) => person.cv[s.key]?.length);
  if (!filled.length) return null;
  return (
    <div className="grid gap-6">
      {filled.map((s) => (
        <section key={s.key} aria-labelledby={`cv-${s.key}`} className="grid gap-3">
          <h3 id={`cv-${s.key}`} className="flex items-center gap-2 text-lg font-bold [font-family:var(--font-display)]">
            <s.icon size={18} aria-hidden /> {s.title}
          </h3>
          <Entries items={person.cv[s.key]} />
        </section>
      ))}
    </div>
  );
}

/**
 * The CV page, in the member's template and accent colour:
 * "classic" sidebar card + timeline, "minimal" one centred column,
 * "spotlight" a coloured cover band, "cards" each section on its own card.
 */
export function ProfileView({ person }: { person: PersonView }) {
  const style = { "--c": accentVar(person.accent) } as React.CSSProperties;
  const hasCv = SECTIONS.some((s) => person.cv[s.key]?.length);

  const intro = (
    <>
      {person.role === "pi" && (
        <span className="tag w-fit" style={{ "--c": "var(--color-yellow)" } as React.CSSProperties}>
          Principal investigator
        </span>
      )}
      <h1 className="display text-[clamp(30px,4.5vw,52px)]">{person.name}</h1>
      {person.headline && <p className="mono text-sm text-ink-2">{person.headline}</p>}
      {person.bio && <p className="whitespace-pre-line text-ink-2">{person.bio}</p>}
      {person.interests.length > 0 && (
        <ul className="chips">
          {person.interests.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      )}
    </>
  );

  if (person.template === "minimal") {
    return (
      <article className="mx-auto grid max-w-[760px] gap-8" style={style}>
        <header className="grid justify-items-center gap-4 text-center">
          <Avatar person={person} size={140} />
          <div className="grid justify-items-center gap-3">{intro}</div>
          <Links person={person} />
        </header>
        <div className="card p-6" style={{ borderTop: "10px solid var(--c)" }}>
          <Sections person={person} />
          {!hasCv && (
            <p className="flex items-center gap-2 text-ink-2">
              <BookOpen size={16} aria-hidden /> More on the links above.
            </p>
          )}
        </div>
      </article>
    );
  }

  if (person.template === "spotlight") {
    return (
      <article className="grid gap-8" style={style}>
        <header className="card relative grid items-center gap-6 overflow-hidden p-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:p-8" style={{ background: "var(--c)", boxShadow: "var(--shadow)" }}>
          <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rotate-12 rounded-[36px] border-2 border-ink bg-paper opacity-40" />
          <span aria-hidden className="pointer-events-none absolute -bottom-16 right-24 h-36 w-36 -rotate-6 rounded-[28px] border-2 border-ink bg-card opacity-30" />
          <div className="relative w-fit rounded-[22px] border-2 border-ink bg-card p-2" style={{ boxShadow: "var(--shadow)" }}>
            <Avatar person={person} size={168} />
          </div>
          <div className="relative grid gap-3 [&_.text-ink-2]:text-ink">
            {intro}
            <Links person={person} />
          </div>
        </header>
        {hasCv && (
          <div className="card p-6 sm:p-8">
            <div className="grid gap-x-10 gap-y-8 lg:grid-cols-2 [&>div]:contents [&_section]:content-start">
              <Sections person={person} />
            </div>
          </div>
        )}
      </article>
    );
  }

  if (person.template === "cards") {
    const filled = SECTIONS.filter((s) => person.cv[s.key]?.length);
    return (
      <article className="grid gap-6" style={style}>
        <header className="grid items-center gap-5 sm:grid-cols-[auto_minmax(0,1fr)]">
          <div className="w-fit -rotate-2 rounded-[20px] border-2 border-ink p-1.5" style={{ background: "var(--c)", boxShadow: "var(--shadow)" }}>
            <Avatar person={person} size={132} />
          </div>
          <div className="grid gap-3">
            {intro}
            <Links person={person} />
          </div>
        </header>
        {filled.length > 0 && (
          <div className="grid items-start gap-4 md:grid-cols-2">
            {filled.map((s) => (
              <section key={s.key} aria-labelledby={`cv-${s.key}`} className="card lift grid gap-3 p-5" style={{ boxShadow: "var(--shadow)" }}>
                <h3 id={`cv-${s.key}`} className="flex w-fit items-center gap-2 rounded-lg border-2 border-ink px-2.5 py-1 text-base font-bold [font-family:var(--font-display)]" style={{ background: "var(--c)" }}>
                  <s.icon size={16} aria-hidden /> {s.title}
                </h3>
                <Entries items={person.cv[s.key]} />
              </section>
            ))}
          </div>
        )}
      </article>
    );
  }

  return (
    <article className="grid items-start gap-8 lg:grid-cols-[300px_minmax(0,1fr)]" style={style}>
      <aside className="card grid gap-4 p-5 lg:sticky lg:top-24" style={{ borderLeft: "10px solid var(--c)", boxShadow: "var(--shadow)" }}>
        <Avatar person={person} size={180} />
        <Links person={person} />
      </aside>
      <div className="grid gap-8">
        <header className="grid gap-3">{intro}</header>
        <Sections person={person} />
      </div>
    </article>
  );
}
