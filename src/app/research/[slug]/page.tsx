import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PublicationCard } from "@/components/pubs/publication-card";
import { SectionHead } from "@/components/site/page-head";
import { accentVar } from "@/components/site/accent";
import { getResearchArea, listPublications, listResearchAreas } from "@/lib/content";
import { getDb } from "@/server/db";
import { allPublications } from "@/server/services/publications";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return listResearchAreas().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const area = getResearchArea((await params).slug);
  return area ? { title: area.title, description: area.summary } : {};
}

export default async function ResearchAreaPage({ params }: Props) {
  const { slug } = await params;
  const area = getResearchArea(slug);
  if (!area) notFound();

  const all = listResearchAreas();
  const idx = all.findIndex((a) => a.slug === slug);
  const next = all[(idx + 1) % all.length];
  const pubs = listPublications({ area: slug }, await allPublications(await getDb()));
  const c = accentVar(area.accent);

  return (
    <div className="wrap page" style={{ "--c": c } as React.CSSProperties}>
      <Link href="/research" className="btn btn-sm mb-8">
        <ArrowLeft size={16} aria-hidden /> All directions
      </Link>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <header className="grid gap-5">
          <p className="eyebrow">
            <span className="dot" style={{ background: c }} />
            Direction {String(idx + 1).padStart(2, "0")} / {String(all.length).padStart(2, "0")}
          </p>
          <h1 className="display text-[clamp(32px,5vw,58px)]">{area.title}</h1>
          <p className="text-[clamp(18px,1.9vw,22px)] font-medium">{area.summary}</p>
          {area.overview.map((p) => (
            <p key={p} className="text-ink-2">
              {p}
            </p>
          ))}
        </header>

        <aside className="card grid gap-4 p-5" style={{ borderTop: `10px solid ${c}` }}>
          <h2 className="eyebrow">Open questions</h2>
          <ol className="grid gap-3">
            {area.questions.map((q, i) => (
              <li key={q} className="flex gap-3">
                <span className="mono shrink-0 font-bold">{String(i + 1).padStart(2, "0")}</span>
                <span>{q}</span>
              </li>
            ))}
          </ol>
          <h2 className="eyebrow mt-2">Keywords</h2>
          <ul className="chips">
            {area.keywords.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        </aside>
      </div>

      <section className="section" aria-labelledby="related">
        <SectionHead id="related" no={String(pubs.length).padStart(2, "0")} title="Related papers" />
        {pubs.length ? (
          <ol className="pubs">
            {pubs.map((p, i) => (
              <PublicationCard key={p.id} pub={p} no={i + 1} />
            ))}
          </ol>
        ) : (
          <p className="card p-6">No papers tagged with this direction yet.</p>
        )}
      </section>

      <div className="section flex justify-end">
        <Link href={`/research/${next.slug}`} className="btn btn-yellow">
          Next: {next.title} <ArrowRight size={17} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
