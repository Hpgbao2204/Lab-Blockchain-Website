import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, PenLine } from "lucide-react";
import { Byline, NEWS_KIND, newsDate, readingMinutes } from "@/components/news/news-card";
import { Markdown } from "@/components/news/markdown";
import { getDb } from "@/server/db";
import { getCurrentUser } from "@/server/auth/current";
import { AppError } from "@/server/errors";
import { getNews } from "@/server/services/news";
import { labToday } from "@/lib/weeks";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  try {
    const user = await getCurrentUser();
    return { item: await getNews(await getDb(), user, slug), user };
  } catch (e) {
    if (e instanceof AppError && e.code === "not_found") return null;
    throw e;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await load((await params).slug);
  if (!found) return {};
  const { item } = found;
  return {
    title: item.title,
    description: item.summary,
    authors: item.author ? [{ name: item.author.name }] : undefined,
    robots: item.status === "published" ? undefined : { index: false },
    openGraph: { title: item.title, description: item.summary, type: "article", publishedTime: item.publishedOn, images: item.cover ? [item.cover] : undefined },
  };
}

const STATE: Record<string, { label: string; text: string }> = {
  draft: { label: "Draft", text: "Only you and the admins can see this draft." },
  submitted: { label: "Waiting for review", text: "An admin will read it and publish it or send it back with notes." },
  rejected: { label: "Sent back", text: "An admin asked for changes. Edit the post and submit it again." },
  scheduled: { label: "Scheduled", text: "Published, but dated in the future; visitors see it from that day." },
};

export default async function NewsItemPage({ params }: Props) {
  const found = await load((await params).slug);
  if (!found) notFound();
  const { item, user } = found;
  const k = NEWS_KIND[item.kind];
  const live = item.status === "published" && item.publishedOn <= labToday();
  const state = live ? null : STATE[item.status === "published" ? "scheduled" : item.status];
  const canEdit = !!user && (user.role === "admin" || (user.id === item.authorId && item.status !== "published"));

  return (
    <article className="wrap page grid max-w-3xl gap-6" style={{ "--c": k.c } as React.CSSProperties}>
      <Link href="/news" className="btn btn-sm w-fit">
        <ArrowLeft size={16} aria-hidden /> All posts
      </Link>
      {state && (
        <div className="note flex-wrap">
          <b>{state.label}</b>
          <span>{state.text}</span>
          {item.reviewNote && item.status === "rejected" && <span className="w-full whitespace-pre-line">Note: {item.reviewNote}</span>}
        </div>
      )}
      <header className="grid gap-4">
        <p className="flex flex-wrap items-center gap-3">
          <Link href={`/news?kind=${item.kind}`} className="tag no-underline">
            {k.label}
          </Link>
          <time className="mono text-sm text-muted" dateTime={item.publishedOn}>
            {newsDate(item.publishedOn)}
          </time>
          {item.body && <span className="mono text-sm text-muted">· {readingMinutes(item.body)} min read</span>}
        </p>
        <h1 className="display text-[clamp(30px,4.4vw,52px)] leading-[1.05]!">{item.title}</h1>
        <p className="text-lg text-ink-2">{item.summary}</p>
        <p className="flex flex-wrap items-center gap-3 text-sm">
          <span>
            By <Byline author={item.author} />
          </span>
          {canEdit && (
            <Link href={`/app/posts/${item.id}`} className="btn btn-xs">
              <PenLine size={12} aria-hidden /> Edit
            </Link>
          )}
        </p>
      </header>
      {item.cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.cover} alt="" className="w-full rounded-[14px] border-2 border-ink shadow-[var(--shadow-lg)]" />
      )}
      {item.body && (
        <div className="card p-6 sm:p-8">
          <Markdown source={item.body} />
        </div>
      )}
      {item.sources && (
        <section aria-labelledby="sources" className="grid gap-2">
          <h2 id="sources" className="eyebrow">
            Sources
          </h2>
          <Markdown source={item.sources} className="text-sm! text-ink-2" />
        </section>
      )}
      {item.link && (
        <a href={item.link} className="btn btn-ink w-fit" target="_blank" rel="noopener noreferrer">
          Read more <ArrowUpRight size={17} aria-hidden />
        </a>
      )}
    </article>
  );
}
