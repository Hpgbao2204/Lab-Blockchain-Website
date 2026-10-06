import type { Metadata } from "next";
import Link from "next/link";
import { Download, PenLine } from "lucide-react";
import { PostRow } from "@/components/app/post-row";
import { ReviewActions } from "@/components/app/review-actions";
import { newsDate } from "@/components/news/news-card";
import { PageHead, SectionHead } from "@/components/site/page-head";
import { getDb } from "@/server/db";
import { requirePageUser } from "@/server/auth/current";
import { authorStats, listNews, listSubmitted, publishedBy } from "@/server/services/news";
import { labToday } from "@/lib/weeks";

export const metadata: Metadata = { title: "Posts" };

export default async function PostsAdminPage() {
  const user = await requirePageUser({ admin: true });
  const db = await getDb();
  const [waiting, authors, all] = await Promise.all([listSubmitted(db, user), authorStats(db, user), listNews(db, user, { all: true, limit: 300 })]);
  const titles = await publishedBy(
    db,
    authors.map((a) => a.id),
  );
  const today = labToday();
  const rest = all.filter((p) => p.status !== "submitted");

  return (
    <div className="wrap page grid grid-cols-[minmax(0,1fr)] gap-10">
      <PageHead eyebrow="Admin · public site" title={<>Posts and <span className="hl">reviews</span></>}>
        Members write posts and submit them here. Approve to publish on the home page and /news, or send back with a note. The table below counts who wrote
        what, e.g. for course credit.
      </PageHead>

      <section aria-labelledby="queue" className="grid gap-4">
        <SectionHead id="queue" no={String(waiting.length).padStart(2, "0")} title="Waiting for review" />
        {waiting.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {waiting.map((p) => (
              <PostRow key={p.id} post={p} showAuthor today={today}>
                <ReviewActions id={p.id} author={p.author?.name ?? "the author"} />
              </PostRow>
            ))}
          </div>
        ) : (
          <p className="note">
            <b>Clear</b>
            <span>Nothing to review. You get an email when a member submits a post.</span>
          </p>
        )}
      </section>

      <section aria-labelledby="authors" className="grid gap-4">
        <SectionHead id="authors" no={String(authors.length).padStart(2, "0")} title="Authors">
          {authors.length > 0 && (
            <a href={"/api/v1/admin/authors?format=csv"} className="btn btn-sm more" download>
              <Download size={15} aria-hidden /> CSV
            </a>
          )}
        </SectionHead>
        {authors.length ? (
          <div className="card overflow-x-auto p-2" style={{ boxShadow: "var(--shadow)" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Author</th>
                  <th className="num">Published</th>
                  <th className="num">Waiting</th>
                  <th className="num">Sent back</th>
                  <th className="num">Drafts</th>
                  <th>Latest post</th>
                </tr>
              </thead>
              <tbody>
                {authors.map((a) => {
                  const mine = titles.filter((t) => t.authorId === a.id);
                  return (
                    <tr key={a.id}>
                      <td>
                        <b>{a.name}</b>
                        <span className="mono block text-xs text-muted">{a.email}</span>
                        {mine.length > 0 && (
                          <details className="mt-1 text-sm">
                            <summary className="cursor-pointer">Published posts</summary>
                            <ul className="mt-1 grid gap-1 pl-4">
                              {mine.map((t) => (
                                <li key={t.slug} className="list-disc">
                                  <Link href={`/news/${t.slug}`} className="underline underline-offset-2">
                                    {t.title}
                                  </Link>{" "}
                                  <span className="mono text-xs text-muted">{newsDate(t.publishedOn)}</span>
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </td>
                      <td className="num font-bold">{a.published}</td>
                      <td className="num">{a.submitted}</td>
                      <td className="num">{a.rejected}</td>
                      <td className="num">{a.drafts}</td>
                      <td className="mono text-xs">{a.lastPublished ? newsDate(a.lastPublished) : "–"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="note">
            <b>Empty</b>
            <span>Nobody has written a post yet.</span>
          </p>
        )}
      </section>

      <section aria-labelledby="all" className="grid gap-4">
        <SectionHead id="all" no={String(rest.length).padStart(2, "0")} title="All posts">
          <Link href="/app/posts/new" className="btn btn-yellow btn-sm more">
            <PenLine size={15} aria-hidden /> Write a post
          </Link>
        </SectionHead>
        <div className="grid gap-4 lg:grid-cols-2">
          {rest.map((p) => (
            <PostRow key={p.id} post={p} showAuthor today={today} />
          ))}
        </div>
      </section>
    </div>
  );
}
