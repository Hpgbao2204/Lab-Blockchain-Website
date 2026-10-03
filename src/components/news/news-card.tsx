import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export interface NewsCardData {
  slug: string;
  kind: "news" | "award" | "paper" | "event";
  title: string;
  summary: string;
  publishedOn: string;
}

export const NEWS_KIND: Record<NewsCardData["kind"], { label: string; c: string }> = {
  news: { label: "News", c: "var(--color-blue)" },
  award: { label: "Award", c: "var(--color-yellow)" },
  paper: { label: "Paper accepted", c: "var(--color-teal)" },
  event: { label: "Event", c: "var(--color-pink)" },
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** `2026-10-03` → `3 Oct 2026` (dates are calendar days, no time zone involved). */
export const newsDate = (d: string) => `${Number(d.slice(8, 10))} ${MONTHS[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;

export function NewsCard({ item }: { item: NewsCardData }) {
  const k = NEWS_KIND[item.kind];
  return (
    <Link href={`/news/${item.slug}`} className="card lift grid h-full content-start gap-2 p-5" style={{ "--c": k.c } as React.CSSProperties}>
      <div className="flex items-center justify-between gap-3">
        <span className="tag">{k.label}</span>
        <time className="mono text-xs text-muted" dateTime={item.publishedOn}>
          {newsDate(item.publishedOn)}
        </time>
      </div>
      <h3 className="text-lg font-bold leading-snug">{item.title}</h3>
      <p className="text-sm text-ink-2">{item.summary}</p>
      <span className="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-bold">
        Read <ArrowUpRight size={15} aria-hidden />
      </span>
    </Link>
  );
}
