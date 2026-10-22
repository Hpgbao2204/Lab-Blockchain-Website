import Link from "next/link";
import { ArrowUpRight, PenLine, Search } from "lucide-react";
import { Hero } from "@/components/hero/hero";
import { PublicationCard } from "@/components/pubs/publication-card";
import { Reveal } from "@/components/site/reveal";
import { SectionHead } from "@/components/site/page-head";
import { NEWS_KIND, NewsCard, type NewsKind } from "@/components/news/news-card";
import { listPublications } from "@/lib/content";
import { getDb } from "@/server/db";
import { getCurrentUser } from "@/server/auth/current";
import { countLiveByKind, listNews } from "@/server/services/news";
import { allPublications } from "@/server/services/publications";
import { venueFacets } from "@/server/services/venues";
import { VENUE_TOPICS } from "@/lib/venues/topics";

export const dynamic = "force-dynamic";

/**
 * The home page is the lab's blog: the protocol hero, then what members wrote (each post approved
 * by an admin). Until the first post is live, the latest papers fill the space.
 */
export default async function Home() {
  const db = await getDb();
  const [posts, counts, venues] = await Promise.all([
    listNews(db, null, { limit: 7 }).catch(() => []),
    countLiveByKind(db).catch(() => ({}) as Partial<Record<NewsKind, number>>),
    venueFacets(db).catch(() => null),
  ]);
  const kinds = (Object.keys(NEWS_KIND) as NewsKind[]).filter((k) => counts[k]);
  const signedIn = !!(await getCurrentUser().catch(() => null));
  const empty = !posts.length;
  const latest = empty ? listPublications({ limit: 4 }, await allPublications(db)) : [];
  let no = 0;
  const next = () => String(++no).padStart(2, "0");

  return (
    <>
      <Hero />

      {posts.length > 0 && (
        <section id="posts" className="wrap section" aria-labelledby="posts-title">
          <SectionHead id="posts-title" no={next()} title="From our members">
            <Link href="/news" className="btn btn-sm more">
              All posts <ArrowUpRight size={16} aria-hidden />
            </Link>
          </SectionHead>
          {kinds.length > 1 && (
            <nav aria-label="Browse posts by kind" className="filters mb-6">
              {kinds.map((k) => (
                <Link key={k} href={`/news?kind=${k}`} className="chip" style={{ "--c": NEWS_KIND[k].c } as React.CSSProperties}>
                  {NEWS_KIND[k].label} <b>{counts[k]}</b>
                </Link>
              ))}
            </nav>
          )}
          <ul className="feed list-none p-0">
            {posts.map((n, i) => (
              <Reveal as="li" key={n.id} delay={Math.min(i, 4) * 60} className={i === 0 ? "lead" : ""}>
                <NewsCard item={n} feature={i === 0} />
              </Reveal>
            ))}
          </ul>
        </section>
      )}

      {empty && (
        <section id="posts" className="wrap section" aria-labelledby="latest">
          <SectionHead id="latest" no={next()} title="Latest papers">
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
      )}

      {venues && venues.total.conference + venues.total.journal > 0 && (
        <section className="wrap section" aria-labelledby="venues-title">
          <SectionHead id="venues-title" no={next()} title="Find where to publish">
            <Link href="/venues" className="btn btn-sm more">
              All venues <ArrowUpRight size={16} aria-hidden />
            </Link>
          </SectionHead>
          <div className="card grid gap-4 p-5 sm:p-7">
            <p className="m-0 text-ink-2">
              Look up any of {venues.total.conference.toLocaleString("en-US")} computer science conferences and {venues.total.journal.toLocaleString("en-US")} journals: CORE and CCF ranks,
              quartiles, impact factors and similar venues.
            </p>
            <form action="/venues" className="venue-search flex gap-3" role="search">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Search conferences and journals</span>
                <Search size={20} aria-hidden />
                <input name="q" type="search" className="field" placeholder="CVPR, IEEE Access, 2169-3536…" />
              </label>
              <button type="submit" className="btn btn-ink">
                Search
              </button>
            </form>
            <nav aria-label="Browse venues by topic" className="filters">
              {VENUE_TOPICS.filter((t) => venues.topics[t.slug]).map((t) => (
                <Link key={t.slug} href={`/venues?topic=${t.slug}`} className="chip" style={{ "--c": `var(--color-${t.c})` } as React.CSSProperties}>
                  {t.label}
                </Link>
              ))}
            </nav>
          </div>
        </section>
      )}

      <section className="wrap section" aria-labelledby="write">
        <div className="card grid items-center gap-4 p-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-8" style={{ background: "color-mix(in srgb, var(--color-yellow) 26%, var(--color-card))" }}>
          <div className="grid gap-2">
            <h2 id="write" className="display text-[clamp(22px,2.6vw,32px)]">
              Write for the lab
            </h2>
            <p className="text-ink-2">
              Members share paper reviews, protocol explainers and incident write-ups here. Sign in, write your post, and an admin reviews it before it goes
              live.
            </p>
          </div>
          <Link href={signedIn ? "/app/posts/new" : "/login?next=/app/posts/new"} className="btn btn-ink w-fit">
            <PenLine size={17} aria-hidden /> Write a post
          </Link>
        </div>
      </section>
    </>
  );
}
