import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export type NewsKind = "news" | "award" | "paper" | "event" | "protocol" | "paper_review" | "incident" | "article" | "tutorial";

export interface NewsCardData {
  slug: string;
  kind: NewsKind;
  title: string;
  summary: string;
  publishedOn: string;
  cover?: string | null;
  body?: string | null;
  author?: { name: string; slug: string | null } | null;
  aiAssisted?: boolean;
}

/** Article kinds members write first, then the lab's own news. `hint` guides authors in the editor. */
export const NEWS_KIND: Record<NewsKind, { label: string; c: string; hint: string }> = {
  protocol: { label: "Protocol", c: "var(--color-blue)", hint: "How a protocol or system works, e.g. HTLC atomic swaps, zk-rollups, IBC." },
  paper_review: { label: "Paper review", c: "var(--color-teal)", hint: "A paper in your own words: the problem, the idea, the results, and what you think of it." },
  incident: { label: "Incident analysis", c: "var(--color-red)", hint: "A hack, exploit or outage: what happened, why it worked, and the lessons." },
  article: { label: "Article", c: "var(--color-violet)", hint: "Your own writing: an idea, a tutorial, notes on your research." },
  news: { label: "News", c: "var(--color-lime)", hint: "Short news from the field or the lab." },
  award: { label: "Award", c: "var(--color-yellow)", hint: "An award or prize (admin only)." },
  paper: { label: "Paper accepted", c: "var(--color-orange)", hint: "A paper of ours that was accepted (admin only)." },
  event: { label: "Event", c: "var(--color-pink)", hint: "A talk, workshop or event (admin only)." },
  tutorial: { label: "Tutorial", c: "var(--color-teal)", hint: "A step-by-step guide on /tutorials (admin only)." },
};
export const ARTICLE_KINDS: NewsKind[] = ["protocol", "paper_review", "incident", "article", "news"];
/** Kinds an admin can pick for a blog post; tutorials are written from /admin/tutorials. */
export const BLOG_KINDS = (Object.keys(NEWS_KIND) as NewsKind[]).filter((k) => k !== "tutorial");

/** Where a post is read: tutorials on /tutorials, everything else on the blog. */
export const postHref = (p: { kind: NewsKind; slug: string }) => (p.kind === "tutorial" ? `/tutorials/${p.slug}` : `/news/${p.slug}`);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** `2026-10-03` → `3 Oct 2026` (dates are calendar days, no time zone involved). */
export const newsDate = (d: string) => `${Number(d.slice(8, 10))} ${MONTHS[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;

/** About 220 words a minute; at least one. */
export const readingMinutes = (body: string | null | undefined) => Math.max(1, Math.round((body ?? "").split(/\s+/).filter(Boolean).length / 220));

/** "By Name" with a link to their page when they have a public profile. */
export function Byline({ author, ai = false, className = "" }: { author: NewsCardData["author"]; ai?: boolean; className?: string }) {
  if (ai) return <span className={`font-bold ${className}`}>Blockchainist Desk</span>;
  if (!author) return <span className={className}>Blockchainist</span>;
  return author.slug ? (
    <Link href={`/people/${author.slug}`} className={`relative z-[1] font-bold underline-offset-4 hover:underline ${className}`}>
      {author.name}
    </Link>
  ) : (
    <span className={`font-bold ${className}`}>{author.name}</span>
  );
}

/**
 * A post on the blog. `feature` is the large lead card on the home page (cover on top, longer
 * summary); the default card fits a three-column grid. The whole card links to the post; the
 * author's name links to their page.
 */
export function NewsCard({ item, feature = false }: { item: NewsCardData; feature?: boolean }) {
  const k = NEWS_KIND[item.kind];
  return (
    <article className={`post-card card lift relative h-full ${feature ? "post-feature" : ""}`} style={{ "--c": k.c } as React.CSSProperties}>
      {item.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="post-cover" src={item.cover} alt="" loading="lazy" />
      ) : (
        <div className="post-cover post-cover-blank" aria-hidden>
          <span>{k.label}</span>
        </div>
      )}
      <div className="grid content-start gap-2 p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="tag">{k.label}</span>
          <time className="mono text-xs text-muted" dateTime={item.publishedOn}>
            {newsDate(item.publishedOn)}
          </time>
          {item.body && <span className="mono text-xs text-muted">· {readingMinutes(item.body)} min read</span>}
        </div>
        <h3 className={`font-bold leading-snug ${feature ? "display text-[clamp(24px,2.6vw,34px)] leading-[1.1]!" : "text-lg"}`}>
          <Link href={postHref(item)} className="after:absolute after:inset-0">
            {item.title}
          </Link>
        </h3>
        <p className={`text-ink-2 ${feature ? "" : "line-clamp-3 text-sm"}`}>{item.summary}</p>
        <p className="mt-1 flex items-center justify-between gap-3 text-sm">
          <span>
            By <Byline author={item.author} ai={item.aiAssisted} />
          </span>
          <ArrowUpRight size={17} aria-hidden />
        </p>
      </div>
    </article>
  );
}
