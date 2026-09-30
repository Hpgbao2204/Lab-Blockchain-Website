import type { Metadata } from "next";
import Image from "next/image";
import { PageHead, SectionHead } from "@/components/site/page-head";
import Link from "next/link";
import { listPeople, listResearchAreas } from "@/lib/content";
import { Reveal } from "@/components/site/reveal";

export const metadata: Metadata = { title: "People", description: "The people behind Blockchainist." };

export default function PeoplePage() {
  const people = listPeople();
  const pis = people.filter((p) => p.role === "pi");
  const members = people.filter((p) => p.role === "member");
  const areas = new Map(listResearchAreas().map((a) => [a.slug, a]));

  return (
    <div className="wrap page">
      <PageHead eyebrow="People" title={<>The <span className="hl">team</span></>}>
        Researchers and students at UIT – VNU-HCM working on trustworthy blockchain systems.
      </PageHead>

      {pis.map((p) => (
        <article key={p.slug} className="card grid gap-6 p-5 sm:grid-cols-[200px_minmax(0,1fr)] sm:p-7">
          {p.photo && (
            <Image
              src={p.photo}
              alt={p.name}
              width={400}
              height={400}
              className="aspect-square w-full max-w-[200px] rounded-xl border-2 border-ink object-cover object-top"
            />
          )}
          <div className="grid content-start gap-3">
            <span className="tag w-fit" style={{ "--c": "var(--color-yellow)" } as React.CSSProperties}>
              Principal investigator
            </span>
            <h2 className="display text-[clamp(26px,3vw,36px)]">{p.name}</h2>
            <p className="mono text-sm text-ink-2">{p.title}</p>
            <p className="text-ink-2">{p.bio}</p>
            <ul className="chips">
              {p.interests.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
            <div className="mt-2 flex flex-wrap gap-3">
              {p.links.map((l) => (
                <a key={l.url} href={l.url} className="btn btn-sm" target="_blank" rel="noopener noreferrer">
                  {l.label} <span aria-hidden>↗</span>
                </a>
              ))}
            </div>
          </div>
        </article>
      ))}

      <section className="section" aria-labelledby="members">
        <SectionHead id="members" no={String(members.length).padStart(2, "0")} title="Members" />
        {members.length === 0 && (
          <p className="note">
            <b>Soon</b>
            <span>Member profiles, with optional CVs, are being prepared and will appear here once the roster is imported.</span>
          </p>
        )}
        {members.some((m) => m.sample) && (
          <p className="note mb-6">
            <b>Sample</b>
            <span>These are placeholder profiles that show the layout. The real roster replaces them soon.</span>
          </p>
        )}
        <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m, i) => {
            const first = m.areas?.map((a) => areas.get(a)).find(Boolean);
            const initials = m.name
              .split(/\s+/)
              .slice(-2)
              .map((w) => w[0])
              .join("");
            return (
              <Reveal as="li" key={m.slug} delay={(i % 3) * 60} className="card grid content-start gap-3 p-5" style={{ "--c": `var(--color-${first?.accent ?? "yellow"})` } as React.CSSProperties}>
                <div className="flex items-center gap-3">
                  <span className="member-mark" aria-hidden>
                    {initials}
                  </span>
                  <div className="grid gap-0.5">
                    <h3 className="text-lg font-bold leading-tight">{m.name}</h3>
                    <p className="mono text-xs text-ink-2">{m.title}</p>
                  </div>
                  {m.sample && <span className="tag ml-auto self-start">sample</span>}
                </div>
                <p className="text-sm text-ink-2">{m.bio}</p>
                <ul className="chips">
                  {m.areas?.map((a) =>
                    areas.get(a) ? (
                      <li key={a}>
                        <Link href={`/research/${a}`} className="no-underline hover:underline">
                          {areas.get(a)!.title}
                        </Link>
                      </li>
                    ) : null,
                  )}
                </ul>
              </Reveal>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
