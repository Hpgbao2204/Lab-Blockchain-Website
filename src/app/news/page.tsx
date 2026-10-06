import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/site/page-head";
import { Reveal } from "@/components/site/reveal";
import { NEWS_KIND, NewsCard, type NewsKind } from "@/components/news/news-card";
import { getDb } from "@/server/db";
import { countLiveByKind, listNews } from "@/server/services/news";

export const metadata: Metadata = {
  title: "Posts",
  description: "Protocol explainers, paper reviews, incident analyses and news from the Blockchainist research group.",
};
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ kind?: string }> };

export default async function NewsPage({ searchParams }: Props) {
  const q = (await searchParams).kind;
  const kind = q && q in NEWS_KIND ? (q as NewsKind) : undefined;
  const db = await getDb();
  const [items, counts] = await Promise.all([listNews(db, null, { kind }), countLiveByKind(db)]);
  const total = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);
  const kinds = (Object.keys(NEWS_KIND) as NewsKind[]).filter((k) => counts[k]);

  return (
    <div className="wrap page">
      <PageHead eyebrow="Posts" title={<>Read the <span className="hl">lab</span></>}>
        Protocols explained, papers reviewed, incidents taken apart, and news from the group. Written by our members.
      </PageHead>
      {kinds.length > 1 && (
        <nav aria-label="Filter posts" className="filters mb-8">
          <Link href="/news" className="chip" aria-pressed={!kind}>
            All <b>{total}</b>
          </Link>
          {kinds.map((k) => (
            <Link key={k} href={`/news?kind=${k}`} className="chip" aria-pressed={kind === k} style={{ "--c": NEWS_KIND[k].c } as React.CSSProperties}>
              {NEWS_KIND[k].label} <b>{counts[k]}</b>
            </Link>
          ))}
        </nav>
      )}
      {items.length ? (
        <ul className="feed list-none p-0">
          {items.map((n, i) => (
            <Reveal as="li" key={n.id} delay={Math.min(i, 6) * 50}>
              <NewsCard item={n} />
            </Reveal>
          ))}
        </ul>
      ) : (
        <p className="note">
          <b>Soon</b>
          <span>No posts here yet.</span>
        </p>
      )}
    </div>
  );
}
