import { and, desc, eq, gte, isNotNull, isNull, lt, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../db/client";
import { deskRuns, feedItems, news, type FeedItem } from "../db/schema";
import { freeSlug } from "../services/news";
import { enabledFeeds, feedByKey, type Feed } from "@/data/feeds";
import { PROTOCOL_TOPICS, type ProtocolTopic } from "@/data/protocol-topics";
import { matchesFilter, parseFeed } from "./rss";
import type { Ai } from "./ai";

/**
 * The daily desk: once a day it reads the feeds, then has the AI write one post for the blog,
 * alternating between a digest of the day's research news and an explainer of a classic
 * protocol. Every post lands in the admins' review queue (status "submitted"); nothing is
 * published without a person approving it.
 */

const DAY = 24 * 3600 * 1000;
const KEEP_DAYS = 30;
const FRESH_DAYS = 7;

export interface FeedReport {
  ok: boolean;
  found: number;
  added: number;
  error?: string;
}

async function fetchOne(feed: Feed, fetcher: typeof fetch) {
  const res = await fetcher(feed.url, {
    headers: { "User-Agent": "BlockchainistDesk/1.0 (+https://www.blockchainist.net)", Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5" },
    signal: AbortSignal.timeout(15_000),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parseFeed(await res.text());
}

/** Reads every enabled feed and stores entries from the last week that it has not seen yet. */
export async function fetchFeeds(db: Db, fetcher: typeof fetch = fetch, now = new Date()) {
  const report: Record<string, FeedReport> = {};
  await Promise.all(
    enabledFeeds().map(async (feed) => {
      try {
        const items = (await fetchOne(feed, fetcher)).filter((i) => matchesFilter(i, feed.filter) && (!i.publishedAt || now.getTime() - i.publishedAt.getTime() < FRESH_DAYS * DAY));
        let added = 0;
        if (items.length) {
          const rows = await db
            .insert(feedItems)
            .values(items.map((i) => ({ source: feed.key, url: i.url, title: i.title, summary: i.summary, publishedAt: i.publishedAt })))
            .onConflictDoNothing({ target: feedItems.url })
            .returning({ id: feedItems.id });
          added = rows.length;
        }
        report[feed.key] = { ok: true, found: items.length, added };
      } catch (e) {
        report[feed.key] = { ok: false, found: 0, added: 0, error: (e as Error).message.slice(0, 200) };
      }
    }),
  );
  await db.delete(feedItems).where(lt(feedItems.fetchedAt, new Date(now.getTime() - KEEP_DAYS * DAY)));
  return report;
}

// ---------------------------------------------------------------------------------------------
// Writing

export interface Draft {
  kind: "news" | "incident" | "protocol";
  title: string;
  summary: string;
  body: string;
  /** numbered list, Markdown */
  sources: string;
  /** the text the check compares against */
  sourceText: string;
}

const STYLE = `You write for the blog of Blockchainist, a blockchain research group at UIT – VNU-HCM (Vietnam). Readers are students and researchers.
Write in clear, plain English. Use Markdown with "##" section headings (no "#" title, no tables of contents). No hype, no price predictions, no investment advice.`;

const draftShape = z.object({
  title: z.string().trim().min(10).max(160),
  summary: z.string().trim().min(30).max(380),
  body: z.string().trim().min(1200).max(20000),
});

const pickShape = z.object({
  ids: z.array(z.coerce.number().int()).max(6),
  angle: z.string().trim().max(400).optional().default(""),
  incident: z.boolean().optional().default(false),
});

const checkShape = z.object({ unsupported: z.array(z.string().trim().min(1)).max(20) });

const date = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "undated");

/** Asks the AI which story of the last days deserves a post; null when nothing is worth writing about. */
export async function pickStory(ai: Ai, items: FeedItem[]) {
  if (!items.length) return null;
  const list = items
    .map((it, i) => {
      const f = feedByKey(it.source);
      return `${i} | ${f?.name ?? it.source} (${f?.type ?? "news"}) | ${date(it.publishedAt)} | ${it.title} | ${it.summary.slice(0, 280).replace(/\n/g, " ")}`;
    })
    .join("\n");
  const reply = pickShape.parse(
    await ai.json(
      `${STYLE}\nYou are choosing today's story for a research news digest.`,
      `Here are recent items from blockchain research blogs, paper archives and trade press (index | source (type) | date | title | start of text):

${list}

Pick ONE story that matters most to blockchain researchers: protocol and cryptography research, security incidents and how they worked, important technical upgrades, or regulation with real technical consequences. Skip market and price news, listings, funding rounds and opinion pieces. Prefer a story covered by several sources and by research sources.
Return JSON: {"ids": [indexes of every item above about that same story, at most 6], "angle": "one sentence on what the post should explain", "incident": true if it is a hack/exploit/outage}. If nothing is worth a post, return {"ids": []}.`,
    ),
  );
  const chosen = [...new Set(reply.ids)].filter((i) => i >= 0 && i < items.length).map((i) => items[i]);
  return chosen.length ? { items: chosen, angle: reply.angle, incident: reply.incident } : null;
}

function numbered(sources: { title: string; publisher: string; url: string; date?: string }[]) {
  return sources.map((s, i) => `${i + 1}. [${s.title.replace(/[[\]]/g, "")}](${s.url}), ${s.publisher}${s.date ? `, ${s.date}` : ""}`).join("\n");
}

export async function writeNews(ai: Ai, story: { items: FeedItem[]; angle: string; incident: boolean }): Promise<Draft> {
  const sources = story.items.map((it, i) => ({ n: i + 1, it, publisher: feedByKey(it.source)?.name ?? it.source }));
  const sourceText = sources.map((s) => `[${s.n}] ${s.it.title} (${s.publisher}, ${date(s.it.publishedAt)})\n${s.it.summary.slice(0, 2500)}`).join("\n\n");
  const reply = draftShape.parse(
    await ai.json(
      `${STYLE}
Rules:
- Use ONLY facts stated in the numbered sources. Do not add numbers, names or dates that are not there. If the sources do not say something, do not guess.
- Put the source number in brackets, like [1] or [1][3], after every sentence that states a fact.
- Never copy sentences. Explain in your own words; at most one short direct quote (under 20 words) in quotation marks, with its number.
- 450 to 750 words, sections: a short opening paragraph, "## What happened", "## Why it matters for researchers", "## Open questions".`,
      `Angle: ${story.angle || "explain the story and its technical substance"}

Sources:
${sourceText}

Return JSON: {"title": "a factual headline", "summary": "one or two sentences, under 300 characters", "body": "the Markdown post"}.`,
    ),
  );
  return {
    kind: story.incident ? "incident" : "news",
    ...reply,
    sources: numbered(sources.map((s) => ({ title: s.it.title, publisher: s.publisher, url: s.it.url, date: s.it.publishedAt ? date(s.it.publishedAt) : undefined }))),
    sourceText,
  };
}

export async function writeProtocol(ai: Ai, topic: ProtocolTopic): Promise<Draft> {
  const refs = topic.refs.map((r, i) => `[${i + 1}] ${r.authors}, "${r.title}", ${r.venue ? `${r.venue} ` : ""}${r.year}`).join("\n");
  const reply = draftShape.parse(
    await ai.json(
      `${STYLE}
You are writing an explainer of a classic protocol or idea, the kind a lecturer would give a strong undergraduate.
Rules:
- Explain how it works step by step, with a small concrete example, then its guarantees, its limits, and where it is used today.
- Cite the given references with their number in brackets, like [1], where you rely on them. Do not cite or link anything else.
- Only state results you are confident are in these papers. When unsure of an exact number or claim, describe it qualitatively instead.
- 700 to 1100 words, with "##" sections. You may use short code blocks or ASCII diagrams.`,
      `Topic: ${topic.title}
Cover: ${topic.angle}

References:
${refs}

Return JSON: {"title": "a clear title", "summary": "one or two sentences, under 300 characters", "body": "the Markdown post"}.`,
    ),
  );
  return {
    kind: "protocol",
    ...reply,
    sources: numbered(topic.refs.map((r) => ({ title: r.title, publisher: `${r.authors}${r.venue ? `, ${r.venue}` : ""}`, url: r.url, date: String(r.year) }))),
    sourceText: refs,
  };
}

/** A second AI pass lists sentences of the draft that the sources do not support, for the reviewer. */
export async function checkDraft(ai: Ai, draft: Draft) {
  const reply = checkShape.parse(
    await ai.json(
      "You are a strict fact checker. You compare an article with its sources and list claims the sources do not support.",
      `Sources:
${draft.sourceText}

Article:
${draft.body}

List every sentence in the article that states a fact (number, name, date, cause, result) NOT supported by the sources${draft.kind === "protocol" ? " or by well-established textbook knowledge of the topic" : ""}. Quote each sentence exactly. Return JSON: {"unsupported": ["..."]}; an empty list if all claims are supported.`,
    ),
  );
  return reply.unsupported;
}

// ---------------------------------------------------------------------------------------------
// The daily run

export interface RunOptions {
  ai: Ai | null;
  today: string;
  trigger?: "cron" | "manual";
  /** write even if a post was already written today (the admin's "Write now") */
  force?: boolean;
  fetcher?: typeof fetch;
  now?: Date;
}

async function nextTopic(db: Db) {
  const used = await db.select({ topic: deskRuns.topic, n: sql<number>`count(*)::int` }).from(deskRuns).where(and(isNotNull(deskRuns.topic), isNotNull(deskRuns.postId))).groupBy(deskRuns.topic);
  const count = new Map(used.map((u) => [u.topic, u.n]));
  const least = Math.min(...PROTOCOL_TOPICS.map((t) => count.get(t.key) ?? 0));
  return PROTOCOL_TOPICS.find((t) => (count.get(t.key) ?? 0) === least)!;
}

async function recentUnused(db: Db, now: Date) {
  return db
    .select()
    .from(feedItems)
    .where(and(isNull(feedItems.postId), gte(feedItems.fetchedAt, new Date(now.getTime() - 3 * DAY))))
    .orderBy(desc(feedItems.publishedAt))
    .limit(80);
}

export async function runDesk(db: Db, opts: RunOptions) {
  const now = opts.now ?? new Date();
  const trigger = opts.trigger ?? "cron";
  const feeds = await fetchFeeds(db, opts.fetcher, now);
  const record = async (row: Partial<typeof deskRuns.$inferInsert>, notes: string[] = []) => {
    const [run] = await db
      .insert(deskRuns)
      .values({ day: opts.today, trigger, report: { feeds, notes }, ...row })
      .returning();
    return run;
  };

  if (!opts.ai) return record({ error: "No AI key set (GEMINI_API_KEY), so no post was written. Feed items were still collected." });
  const ai = opts.ai;

  if (!opts.force) {
    const [done] = await db.select({ id: deskRuns.id }).from(deskRuns).where(and(eq(deskRuns.day, opts.today), isNotNull(deskRuns.postId))).limit(1);
    if (done) return record({}, ["A post was already written today."]);
  }

  // Alternate: after a news digest comes an explainer, and the other way round.
  const [last] = await db.select({ kind: deskRuns.kind }).from(deskRuns).where(isNotNull(deskRuns.postId)).orderBy(desc(deskRuns.createdAt)).limit(1);
  const order: ("news" | "protocol")[] = last?.kind === "news" ? ["protocol", "news"] : ["news", "protocol"];
  const notes: string[] = [];

  try {
    let draft: Draft | null = null;
    let topic: ProtocolTopic | null = null;
    let used: FeedItem[] = [];
    for (const kind of order) {
      if (kind === "news") {
        const story = await pickStory(ai, await recentUnused(db, now));
        if (!story) {
          notes.push("No news story worth a post in the last three days.");
          continue;
        }
        draft = await writeNews(ai, story);
        used = story.items;
      } else {
        topic = await nextTopic(db);
        draft = await writeProtocol(ai, topic);
      }
      break;
    }
    if (!draft) return record({ error: "Nothing was written." }, notes);

    let aiCheck: string;
    try {
      const unsupported = await checkDraft(ai, draft);
      aiCheck = unsupported.length ? unsupported.map((s) => `- ${s}`).join("\n") : "";
    } catch (e) {
      aiCheck = `- The automatic fact check did not run (${(e as Error).message.slice(0, 120)}). Check every claim against the sources.`;
    }

    const row = {
      kind: draft.kind,
      title: clean(draft.title),
      summary: clean(draft.summary),
      body: clean(draft.body),
      sources: clean(draft.sources).slice(0, 4000),
      publishedOn: opts.today,
      status: "submitted" as const,
      submittedAt: now,
      authorId: null,
      aiAssisted: true,
      aiCheck: clean(aiCheck) || null,
    };
    // One retry: a pooled connection can be closed by the database during the long AI calls.
    let post: typeof news.$inferSelect;
    try {
      [post] = await db.insert(news).values({ slug: await freeSlug(db, row.title), ...row }).returning();
    } catch (e) {
      notes.push(`Saving the post failed once (${errorText(e)}); tried again.`);
      [post] = await db.insert(news).values({ slug: await freeSlug(db, row.title), ...row }).returning();
    }
    for (const it of used) await db.update(feedItems).set({ postId: post.id }).where(eq(feedItems.id, it.id));
    return record({ kind: draft.kind === "protocol" ? "protocol" : "news", topic: topic?.key ?? null, postId: post.id }, notes);
  } catch (e) {
    return record({ error: errorText(e) }, notes);
  }
}

/** Postgres rejects NUL in text; other control characters (except tab and newline) are noise. */
export function clean(s: string) {
  return s.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "");
}

/**
 * Drizzle's "Failed query: <the whole SQL>" hides the real reason in `cause`; put the database's
 * own message (and code) first so it fits on the admin page.
 */
export function errorText(e: unknown) {
  const err = e as Error & { cause?: { message?: string; code?: string; detail?: string } };
  const cause = err?.cause;
  if (cause?.message) return [`Database error: ${cause.message}`, cause.code && `(code ${cause.code})`, cause.detail].filter(Boolean).join(" ").slice(0, 500);
  const msg = err?.message ?? String(e);
  return (msg.startsWith("Failed query:") ? `Database error on: ${msg.slice(14, 120)}…` : msg).slice(0, 500);
}

/** For the admin page: recent runs, per-feed counts and the latest items. */
export async function deskStatus(db: Db) {
  const [runs, perFeed, items] = await Promise.all([
    db.select().from(deskRuns).orderBy(desc(deskRuns.createdAt)).limit(10),
    db
      .select({ source: feedItems.source, n: sql<number>`count(*)::int`, latest: sql<Date | null>`max(${feedItems.publishedAt})` })
      .from(feedItems)
      .groupBy(feedItems.source),
    db
      .select({ id: feedItems.id, source: feedItems.source, url: feedItems.url, title: feedItems.title, publishedAt: feedItems.publishedAt, postId: feedItems.postId, postSlug: news.slug })
      .from(feedItems)
      .leftJoin(news, eq(news.id, feedItems.postId))
      .orderBy(desc(feedItems.fetchedAt), desc(feedItems.publishedAt))
      .limit(40),
  ]);
  return { runs, perFeed, items };
}
