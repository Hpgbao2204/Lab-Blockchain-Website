import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHead } from "@/components/site/page-head";
import { Reveal } from "@/components/site/reveal";
import { accentVar } from "@/components/site/accent";
import { listPublications, listResearchAreas } from "@/lib/content";
import { getDb } from "@/server/db";
import { allPublications } from "@/server/services/publications";

export const metadata: Metadata = { title: "Research", description: "Research directions of the Blockchainist group." };

export const dynamic = "force-dynamic";

export default async function ResearchPage() {
  const all = await allPublications(await getDb());
  const areas = listResearchAreas();
  return (
    <div className="wrap page">
      <PageHead eyebrow="Research directions" title={<>What we <span className="hl">work on</span></>}>
        Six directions that share one goal: systems where no single party has to be trusted.
      </PageHead>
      <ul className="areas">
        {areas.map((a, i) => (
          <Reveal as="li" key={a.slug} delay={i * 60}>
              <Link href={`/research/${a.slug}`} className="area" style={{ "--c": accentVar(a.accent) } as React.CSSProperties}>
                <div className="flex items-start justify-between gap-3">
                  <h3>{a.title}</h3>
                  <ArrowUpRight size={20} aria-hidden className="shrink-0" />
                </div>
                <p>{a.summary}</p>
                <ul className="chips mt-auto pt-2">
                  {a.keywords.map((k) => (
                    <li key={k}>{k}</li>
                  ))}
                </ul>
                <p className="mono text-xs! text-muted!">{listPublications({ area: a.slug }, all).length} related papers</p>
              </Link>
          </Reveal>
        ))}
      </ul>
    </div>
  );
}
