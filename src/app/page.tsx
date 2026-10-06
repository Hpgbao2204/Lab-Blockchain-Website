import Link from "next/link";
import { ArrowUpRight, PenLine } from "lucide-react";
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

export const dynamic = "force-dynamic";

/**
 * The home page is the lab's blog: the protocol hero, then the latest posts (the newest one large).
 * Until the first post is live, the latest papers fill the space instead.
 */
export default async function Home() {
  const db = await getDb();
  const [posts, counts] = await Promise.all([listNews(db, null, { limit: 10 }).catch(() => []), countLiveByKind(db).catch(() => ({}) as Partial<Record<NewsKind, number>>)]);
  const kinds = (Object.keys(NEWS_KIND) as NewsKind[]).filter((k) => counts[k]);
  const signedIn = !!(await getCurrentUser().catch(() => null));
  const latest = posts.length ? [] : listPublications({ limit: 4 }, await allPublications(db));

  return (
    <>
      <Hero />

      {posts.length > 0 && (
        <section id="posts" className="wrap section" aria-labelledby="posts-title">
          <SectionHead id="posts-title" no="01" title="Latest from the lab">
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

      {posts.length === 0 && (
        <section id="posts" className="wrap section" aria-labelledby="latest">
          <SectionHead id="latest" no="01" title="Latest papers">
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
