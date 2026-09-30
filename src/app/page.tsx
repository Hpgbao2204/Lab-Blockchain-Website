import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Hero } from "@/components/hero/hero";
import { PublicationCard } from "@/components/pubs/publication-card";
import { Reveal } from "@/components/site/reveal";
import { SectionHead } from "@/components/site/page-head";
import { getStats, listPublications, listResearchAreas } from "@/lib/content";

export default function Home() {
  const stats = getStats();
  const areas = listResearchAreas();
  const latest = listPublications({ limit: 2 });

  const tiles = [
    { href: "/research", title: "Research", text: areas.map((a) => a.title).slice(0, 3).join(" · ") + " and more.", big: stats.researchAreas, c: "var(--color-yellow)", wide: true },
    { href: "/publications", title: "Publications", text: "Journal and conference papers, searchable by year, type and direction.", big: stats.publications, c: "var(--color-blue)", wide: true },
    { href: "/people", title: "People", text: "The principal investigator and, soon, every member's profile.", c: "var(--color-card)" },
    { href: "/pioneers", title: "Pioneers", text: `${stats.pioneers} people whose ideas made blockchains possible.`, c: "var(--color-teal)" },
    { href: "/join", title: "Join us", text: "Students who like hard problems in trust and privacy.", c: "var(--color-pink)" },
  ];

  return (
    <>
      <Hero />

      <section className="wrap section" aria-labelledby="explore">
        <SectionHead id="explore" no="01" title="Explore the lab" />
        <div className="tiles">
          {tiles.map((t, i) => (
            <Reveal key={t.href} delay={i * 60} className={`tile-cell ${t.wide ? "wide" : ""}`}>
              <Link href={t.href} className="tile card lift h-full" style={{ "--c": t.c } as React.CSSProperties}>
                <div className="flex items-start justify-between gap-4">
                  <h3>{t.title}</h3>
                  {t.big !== undefined && <span className="big">{t.big}</span>}
                </div>
                <p>{t.text}</p>
                <span className="go">
                  Open <ArrowUpRight size={18} aria-hidden />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="wrap section" aria-labelledby="latest">
        <SectionHead id="latest" no="02" title="Latest papers">
          <Link href="/publications" className="btn btn-sm more">
            All publications <ArrowUpRight size={16} aria-hidden />
          </Link>
        </SectionHead>
        <ol className="pubs">
          {latest.map((p, i) => (
            <PublicationCard key={p.id} pub={p} no={i + 1} />
          ))}
        </ol>
      </section>
    </>
  );
}
