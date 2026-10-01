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
          Portfolio <ArrowUpRight size={14} aria-hidden />
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

/** "classic": sidebar card + timeline; "minimal": one centred column. Both use the member's accent colour. */
export function ProfileView({ person }: { person: PersonView }) {
  const style = { "--c": accentVar(person.accent) } as React.CSSProperties;
  const portfolio = person.display === "portfolio" && person.portfolioUrl;

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

  const portfolioCall = portfolio && (
    <a href={person.portfolioUrl!} target="_blank" rel="noopener noreferrer" className="card lift flex items-center justify-between gap-4 p-5" style={{ background: "var(--c)", boxShadow: "var(--shadow)" }}>
      <span className="grid gap-1">
        <span className="mono text-xs uppercase tracking-widest">Personal portfolio</span>
        <span className="text-lg font-bold [font-family:var(--font-display)]">{new URL(person.portfolioUrl!).host + new URL(person.portfolioUrl!).pathname.replace(/\/$/, "")}</span>
      </span>
      <ArrowUpRight size={28} aria-hidden />
    </a>
  );

  if (person.template === "minimal") {
    return (
      <article className="mx-auto grid max-w-[760px] gap-8" style={style}>
        <header className="grid justify-items-center gap-4 text-center">
          <Avatar person={person} size={140} />
          <div className="grid justify-items-center gap-3">{intro}</div>
          <Links person={person} />
        </header>
        {portfolioCall}
        <div className="card p-6" style={{ borderTop: "10px solid var(--c)" }}>
          <Sections person={person} />
          {!SECTIONS.some((s) => person.cv[s.key]?.length) && (
            <p className="flex items-center gap-2 text-ink-2">
              <BookOpen size={16} aria-hidden /> More on {portfolio ? "the portfolio above" : "the links above"}.
            </p>
          )}
        </div>
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
        {portfolioCall}
        <Sections person={person} />
      </div>
    </article>
  );
}
