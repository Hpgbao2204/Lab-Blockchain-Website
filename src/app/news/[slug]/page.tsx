import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { NEWS_KIND, newsDate } from "@/components/news/news-card";
import { getDb } from "@/server/db";
import { getCurrentUser } from "@/server/auth/current";
import { AppError } from "@/server/errors";
import { getNews } from "@/server/services/news";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  try {
    return await getNews(await getDb(), await getCurrentUser(), slug);
  } catch (e) {
    if (e instanceof AppError && e.code === "not_found") return null;
    throw e;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await load((await params).slug);
  return item ? { title: item.title, description: item.summary, openGraph: { title: item.title, description: item.summary, type: "article" } } : {};
}

export default async function NewsItemPage({ params }: Props) {
  const item = await load((await params).slug);
  if (!item) notFound();
  const k = NEWS_KIND[item.kind];
  const paragraphs = (item.body ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <article className="wrap page grid max-w-3xl gap-6" style={{ "--c": k.c } as React.CSSProperties}>
      <Link href="/news" className="btn btn-sm w-fit">
        <ArrowLeft size={16} aria-hidden /> All news
      </Link>
      <header className="grid gap-4">
        <p className="flex flex-wrap items-center gap-3">
          <span className="tag">{k.label}</span>
          <time className="mono text-sm text-muted" dateTime={item.publishedOn}>
            {newsDate(item.publishedOn)}
          </time>
          {!item.published && <span className="tag" style={{ "--c": "var(--color-card)" } as React.CSSProperties}>Draft</span>}
        </p>
        <h1 className="display text-[clamp(30px,4.4vw,52px)]">{item.title}</h1>
        <p className="text-lg text-ink-2">{item.summary}</p>
      </header>
      {paragraphs.length > 0 && (
        <div className="card grid gap-4 p-6 leading-relaxed">
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>
      )}
      {item.link && (
        <a href={item.link} className="btn btn-ink w-fit" target="_blank" rel="noopener noreferrer">
          Read more <ArrowUpRight size={17} aria-hidden />
        </a>
      )}
    </article>
  );
}
