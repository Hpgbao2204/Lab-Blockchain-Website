import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHead, SectionHead } from "@/components/site/page-head";
import { Reveal } from "@/components/site/reveal";
import { Avatar, accentVar } from "@/components/people/profile-view";
import { listResearchAreas } from "@/lib/content";
import { getDb } from "@/server/db";
import { listPublicPeople, type PersonView } from "@/server/services/people";

export const metadata: Metadata = { title: "Team", description: "The people behind Blockchainist." };
export const dynamic = "force-dynamic";

/** Every real member has an address here; it shows their CV or their own website, as they chose. */
const hrefOf = (p: PersonView) => (p.hasPage ? `/people/${p.slug}` : null);
const hasSite = (p: PersonView) => p.display !== "template" && !!p.portfolioUrl;

export default async function PeoplePage() {
  const people = await listPublicPeople(await getDb());
  const pis = people.filter((p) => p.role === "pi");
  const members = people.filter((p) => p.role === "member");
  const areas = new Map(listResearchAreas().map((a) => [a.slug, a]));

  return (
    <div className="wrap page">
      <PageHead eyebrow="Team" title={<>The <span className="hl">team</span></>}>
        Researchers and students at UIT – VNU-HCM working on trustworthy blockchain systems.
      </PageHead>

      {pis.map((p) => (
        <article key={p.slug} className="card grid gap-6 p-5 sm:grid-cols-[200px_minmax(0,1fr)] sm:p-7">
          <Avatar person={p} size={200} />
          <div className="grid content-start gap-3">
            <span className="tag w-fit" style={{ "--c": "var(--color-yellow)" } as React.CSSProperties}>
              Principal investigator
            </span>
            <h2 className="display text-[clamp(26px,3vw,36px)]">{p.name}</h2>
            {p.headline && <p className="mono text-sm text-ink-2">{p.headline}</p>}
            {p.bio && <p className="text-ink-2">{p.bio}</p>}
            <ul className="chips">
              {p.interests.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
            <div className="mt-2 flex flex-wrap gap-3">
              <Link href={`/people/${p.slug}`} className="btn btn-sm btn-ink">
                Profile
              </Link>
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
            <span>Member profiles appear here as members publish them.</span>
          </p>
        )}
        {members.some((m) => m.sample) && (
          <p className="note mb-6">
            <b>Sample</b>
            <span>These are placeholder profiles that show the layout. They disappear once members publish their own.</span>
          </p>
        )}
        <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m, i) => {
            const firstArea = m.areas.map((a) => areas.get(a)).find(Boolean);
            const href = hrefOf(m);
            const color = m.sample ? `var(--color-${firstArea?.accent ?? "yellow"})` : accentVar(m.accent);
            return (
              <Reveal as="li" key={m.slug} delay={(i % 3) * 60} className="card relative grid content-start gap-3 p-5" style={{ "--c": color } as React.CSSProperties}>
                <div className="flex items-center gap-3">
                  <Avatar person={m} size={52} />
                  <div className="grid gap-0.5">
                    <h3 className="text-lg font-bold leading-tight">
                      {href ? (
                        <Link href={href} className="after:absolute after:inset-0">
                          {m.name}
                        </Link>
                      ) : (
                        m.name
                      )}
                    </h3>
                    {m.headline && <p className="mono text-xs text-ink-2">{m.headline}</p>}
                  </div>
                  {m.sample && <span className="tag ml-auto self-start">sample</span>}
                  {href && (
                    <span className="tag ml-auto self-start" style={{ "--c": color } as React.CSSProperties}>
                      {hasSite(m) ? "Website" : "CV"} <ArrowUpRight size={11} className="inline" aria-hidden />
                    </span>
                  )}
                </div>
                {m.bio && <p className="line-clamp-4 text-sm text-ink-2">{m.bio}</p>}
                <ul className="chips">
                  {(m.areas.length ? m.areas.map((a) => areas.get(a)?.title).filter(Boolean) : m.interests.slice(0, 4)).map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </Reveal>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
