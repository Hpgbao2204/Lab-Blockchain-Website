import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { RunDesk } from "@/components/app/run-desk";
import { PageHead, SectionHead } from "@/components/site/page-head";
import { FEEDS, feedByKey } from "@/data/feeds";
import { PROTOCOL_TOPICS, topicByKey } from "@/data/protocol-topics";
import { getDb } from "@/server/db";
import { requirePageUser } from "@/server/auth/current";
import { aiFromEnv } from "@/server/desk/ai";
import { deskStatus, type FeedReport } from "@/server/desk/desk";

export const metadata: Metadata = { title: "Daily desk" };
export const dynamic = "force-dynamic";

const when = (d: Date | null) => (d ? d.toISOString().slice(0, 16).replace("T", " ") + " UTC" : "–");

export default async function DeskPage() {
  await requirePageUser({ admin: true });
  const ai = aiFromEnv();
  const { runs, perFeed, items } = await deskStatus(await getDb());
  const lastFeeds = (runs[0]?.report as { feeds?: Record<string, FeedReport> } | undefined)?.feeds ?? {};

  return (
    <div className="wrap page grid grid-cols-[minmax(0,1fr)] gap-10">
      <PageHead eyebrow="Admin · public site" title={<>Daily <span className="hl">desk</span></>}>
        Every morning (around 06:00 Vietnam time) the desk reads the research blogs and news feeds below and drafts one post: a digest of the day&apos;s
        research news, or an explainer of a classic protocol. Drafts wait in <Link href="/admin/posts" className="underline underline-offset-4">Posts</Link>{" "}
        until you approve them; nothing is published on its own.
      </PageHead>

      <div className={ai ? "success" : "error"}>
        {ai ? (
          <>
            Writing with <b>{ai.label}</b>.
          </>
        ) : (
          <>
            No AI key yet, so the desk only collects feed items. To let it write, add a free <code>GEMINI_API_KEY</code> (Google AI Studio) to the hosting
            environment (never paste keys in chat).
          </>
        )}
      </div>
      <RunDesk hasAi={!!ai} />

      <section aria-labelledby="runs" className="grid gap-4">
        <SectionHead id="runs" no={String(runs.length).padStart(2, "0")} title="Recent runs" />
        {runs.length ? (
          <div className="card overflow-x-auto p-2" style={{ boxShadow: "var(--shadow)" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Trigger</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => {
                  const notes = (r.report as { notes?: string[] }).notes ?? [];
                  return (
                    <tr key={r.id}>
                      <td className="mono text-xs">{when(r.createdAt)}</td>
                      <td>{r.trigger}</td>
                      <td className="text-sm">
                        {r.postId ? (
                          <b>{r.kind === "protocol" ? `Explainer: ${topicByKey(r.topic ?? "")?.title ?? r.topic}` : "News digest"} written</b>
                        ) : r.error ? (
                          <span><b>Not written:</b> {r.error}</span>
                        ) : (
                          "Feeds fetched, no post"
                        )}
                        {notes.map((n) => (
                          <span key={n} className="block text-muted">
                            {n}
                          </span>
                        ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="note">
            <b>Not run yet</b>
            <span>The first run happens tomorrow morning, or press the button above.</span>
          </p>
        )}
      </section>

      <section aria-labelledby="feeds" className="grid gap-4">
        <SectionHead id="feeds" no={String(FEEDS.length).padStart(2, "0")} title="Feeds" />
        <div className="card overflow-x-auto p-2" style={{ boxShadow: "var(--shadow)" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Feed</th>
                <th>Kind</th>
                <th>Last run</th>
                <th className="num">Items (30 days)</th>
                <th>Newest item</th>
              </tr>
            </thead>
            <tbody>
              {FEEDS.map((f) => {
                const stats = perFeed.find((p) => p.source === f.key);
                const last = lastFeeds[f.key];
                return (
                  <tr key={f.key}>
                    <td>
                      <a href={f.site} target="_blank" rel="noopener noreferrer" className="font-bold underline-offset-4 hover:underline">
                        {f.name}
                      </a>
                      {f.enabled === false && <span className="block text-xs text-muted">off</span>}
                      {f.filter && <span className="block text-xs text-muted">blockchain topics only</span>}
                    </td>
                    <td>{f.type}</td>
                    <td className="text-sm">{last ? (last.ok ? `OK, ${last.added} new` : <span><b>Failed:</b> {last.error}</span>) : "–"}</td>
                    <td className="num">{stats?.n ?? 0}</td>
                    <td className="mono text-xs">{stats?.latest ? when(new Date(stats.latest)) : "–"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted">
          Feeds and the {PROTOCOL_TOPICS.length} explainer topics are listed in <code>src/data/feeds.ts</code> and <code>src/data/protocol-topics.ts</code>.
          The desk uses only what each feed publishes and links back to the original.
        </p>
      </section>

      <section aria-labelledby="items" className="grid gap-4">
        <SectionHead id="items" no={String(items.length).padStart(2, "0")} title="Latest items" />
        {items.length ? (
          <ul className="card grid gap-0 p-2" style={{ boxShadow: "var(--shadow)" }}>
            {items.map((it) => (
              <li key={it.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-dashed border-ink/30 p-2 last:border-0">
                <span className="tag">{feedByKey(it.source)?.name ?? it.source}</span>
                <a href={it.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 font-bold underline-offset-4 [overflow-wrap:anywhere] hover:underline">
                  {it.title}
                </a>
                <span className="mono text-xs text-muted">{it.publishedAt ? it.publishedAt.toISOString().slice(0, 10) : ""}</span>
                {it.postSlug && (
                  <Link href={`/news/${it.postSlug}`} className="btn btn-xs">
                    Used <ArrowUpRight size={12} aria-hidden />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="note">
            <b>Empty</b>
            <span>No feed items yet.</span>
          </p>
        )}
      </section>
    </div>
  );
}
