import { and, asc, desc, eq, inArray, like, lte, ne, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { z } from "zod";
import type { Db } from "../db/client";
import { news, profiles, users, type NewsItem } from "../db/schema";
import { AppError } from "../errors";
import type { SessionUser } from "../auth/sessions";
import type { Mail } from "../mail";
import { labNewsKinds, type newsInput, type newsKinds, type newsReviewInput } from "../validation";
import { requireAdmin } from "./users";
import { button, esc, shell, siteHost } from "./meetings";
import { labToday } from "@/lib/weeks";

type NewsInput = z.infer<typeof newsInput>;
export type NewsKind = (typeof newsKinds)[number];
export type { NewsItem };

/** Summaries of other people's work must say where the material comes from before review. */
export const NEEDS_SOURCES: NewsKind[] = ["protocol", "paper_review", "incident"];

/** `"Best Paper Award at SoICT 2026!"` → `best-paper-award-at-soict-2026`. */
export function slugify(title: string) {
  const s = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/, "");
  return s || "news";
}

export async function freeSlug(db: Db, title: string, exceptId?: string) {
  const base = slugify(title);
  const taken = new Set(
    (
      await db
        .select({ slug: news.slug })
        .from(news)
        .where(exceptId ? and(like(news.slug, `${base}%`), ne(news.id, exceptId)) : like(news.slug, `${base}%`))
    ).map((r) => r.slug),
  );
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
}

const isAdmin = (actor: SessionUser | null) => actor?.role === "admin";
const reviewer = alias(users, "reviewer");

/** A post with its byline: the author's name and, when they have a public profile, its address. */
const postColumns = {
  id: news.id,
  slug: news.slug,
  kind: news.kind,
  title: news.title,
  summary: news.summary,
  body: news.body,
  link: news.link,
  cover: news.cover,
  sources: news.sources,
  publishedOn: news.publishedOn,
  status: news.status,
  reviewNote: news.reviewNote,
  reviewedAt: news.reviewedAt,
  submittedAt: news.submittedAt,
  authorId: news.authorId,
  aiAssisted: news.aiAssisted,
  aiCheck: news.aiCheck,
  createdAt: news.createdAt,
  updatedAt: news.updatedAt,
  author: { name: users.name, slug: profiles.slug },
  reviewer: { name: reviewer.name },
};

function selectPosts(db: Db) {
  return db
    .select(postColumns)
    .from(news)
    .leftJoin(users, eq(users.id, news.authorId))
    .leftJoin(profiles, and(eq(profiles.userId, news.authorId), eq(profiles.published, true)))
    .leftJoin(reviewer, eq(reviewer.id, news.reviewedBy))
    .$dynamic();
}
type Row = Awaited<ReturnType<ReturnType<typeof selectPosts>["execute"]>>[number];
/** A post whose author account was deleted has no byline (shown as the lab). */
const shape = (r: Row) => ({
  ...r,
  author: r.author?.name ? { name: r.author.name, slug: r.author.slug } : null,
  reviewer: r.reviewer?.name ? { name: r.reviewer.name } : null,
});
const shapeAll = (rows: Row[]) => rows.map(shape);
/** The bot's fact-check notes are for reviewers only. */
const forViewer = <T extends { aiCheck: string | null }>(actor: SessionUser | null, p: T): T => (isAdmin(actor) ? p : { ...p, aiCheck: null });
export type PostView = ReturnType<typeof shape>;

const live = () => and(eq(news.status, "published"), lte(news.publishedOn, labToday()));

/**
 * Visitors see published posts dated today or earlier (Vietnam time), newest first, optionally of
 * one kind. Admins may ask for everything, including drafts, posts waiting for review and
 * scheduled items.
 */
export async function listNews(db: Db, actor: SessionUser | null, opts: { all?: boolean; limit?: number; kind?: NewsKind; offset?: number; ai?: boolean } = {}) {
  const where: SQL[] = [];
  if (!(opts.all && isAdmin(actor))) where.push(live()!);
  if (opts.kind) where.push(eq(news.kind, opts.kind));
  if (opts.ai !== undefined) where.push(eq(news.aiAssisted, opts.ai));
  return shapeAll(
    await selectPosts(db)
      .where(where.length ? and(...where) : undefined)
      .orderBy(desc(news.publishedOn), desc(news.createdAt))
      .limit(opts.limit ?? 100)
      .offset(opts.offset ?? 0),
  ).map((p) => forViewer(actor, p));
}

/** How many live posts there are of each kind, for the filter on /news. */
export async function countLiveByKind(db: Db) {
  const rows = await db.select({ kind: news.kind, n: sql<number>`count(*)::int` }).from(news).where(live()).groupBy(news.kind);
  return Object.fromEntries(rows.map((r) => [r.kind, r.n])) as Partial<Record<NewsKind, number>>;
}

/** Everything a member wrote, in any state, newest first. */
export async function listMyPosts(db: Db, actor: SessionUser | null) {
  if (!actor) throw new AppError("unauthorized", "Sign in first.");
  return shapeAll(await selectPosts(db).where(eq(news.authorId, actor.id)).orderBy(desc(news.updatedAt)));
}

/** Posts waiting for review, oldest first, so nobody waits longest. */
export async function listSubmitted(db: Db, actor: SessionUser | null) {
  requireAdmin(actor);
  return shapeAll(await selectPosts(db).where(eq(news.status, "submitted")).orderBy(asc(news.submittedAt)));
}

/**
 * Anyone may read a live post. A post that is not live yet (draft, waiting, sent back,
 * scheduled) is only found by its author and admins; everyone else gets a 404.
 */
export async function getNews(db: Db, actor: SessionUser | null, slug: string) {
  const [item] = await selectPosts(db).where(eq(news.slug, slug)).limit(1);
  if (!item || !canSee(actor, item)) throw new AppError("not_found", "Post not found.");
  return forViewer(actor, shape(item));
}

export async function getPostById(db: Db, actor: SessionUser | null, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new AppError("not_found", "Post not found.");
  const [item] = await selectPosts(db).where(eq(news.id, id)).limit(1);
  if (!item || !canSee(actor, item)) throw new AppError("not_found", "Post not found.");
  return forViewer(actor, shape(item));
}

function canSee(actor: SessionUser | null, item: { status: string; publishedOn: string; authorId: string | null }) {
  if (item.status === "published" && item.publishedOn <= labToday()) return true;
  return isAdmin(actor) || (!!actor && actor.id === item.authorId);
}

function requireMember(actor: SessionUser | null): asserts actor is SessionUser {
  if (!actor) throw new AppError("unauthorized", "Sign in first.");
}

function checkKind(actor: SessionUser, kind: NewsKind) {
  if (!isAdmin(actor) && (labNewsKinds as readonly string[]).includes(kind) && kind !== "news")
    throw new AppError("forbidden", "Awards, accepted papers and events are posted by the admin.");
}

async function loadOwn(db: Db, actor: SessionUser, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new AppError("not_found", "Post not found.");
  const [item] = await db.select().from(news).where(eq(news.id, id)).limit(1);
  if (!item || (!isAdmin(actor) && item.authorId !== actor.id)) throw new AppError("not_found", "Post not found.");
  return item;
}

const fields = (input: NewsInput) => ({
  kind: input.kind,
  title: input.title,
  summary: input.summary,
  body: input.body ?? null,
  link: input.link ?? null,
  cover: input.cover ?? null,
  sources: input.sources ?? null,
});

/**
 * Any signed-in member can start a post; it stays a draft until they submit it for review.
 * Admins publish straight away (or keep a draft, or pick a later date).
 */
export async function createNews(db: Db, actor: SessionUser | null, input: NewsInput) {
  requireMember(actor);
  checkKind(actor, input.kind);
  const admin = isAdmin(actor);
  const status = admin ? (input.status ?? "published") : "draft";
  const [item] = await db
    .insert(news)
    .values({
      ...fields(input),
      slug: await freeSlug(db, input.title),
      publishedOn: (admin && input.publishedOn) || labToday(),
      status,
      authorId: actor.id,
      ...(admin && status === "published" ? { reviewedBy: actor.id, reviewedAt: new Date() } : {}),
    })
    .returning();
  return item;
}

/**
 * Authors edit their own post until it is published (a post waiting for review stays in the
 * queue with the new text). After that only an admin can change it, so a live post never
 * changes without review. The address follows the title only while the post is not live.
 */
export async function updateNews(db: Db, actor: SessionUser | null, id: string, input: NewsInput) {
  requireMember(actor);
  const old = await loadOwn(db, actor, id);
  const admin = isAdmin(actor);
  if (!admin && old.status === "published") throw new AppError("forbidden", "This post is published. Ask an admin to change it.");
  checkKind(actor, input.kind);
  const slug = old.title === input.title || old.status === "published" ? old.slug : await freeSlug(db, input.title, id);
  const status = admin && input.status ? input.status : old.status;
  const [item] = await db
    .update(news)
    .set({
      ...fields(input),
      slug,
      status,
      ...(admin && input.publishedOn ? { publishedOn: input.publishedOn } : {}),
      ...(admin && status === "published" && old.status !== "published" ? { reviewedBy: actor.id, reviewedAt: new Date() } : {}),
      updatedAt: new Date(),
    })
    .where(eq(news.id, id))
    .returning();
  return item;
}

/** Sends a draft (or a post that was sent back) to the admins for review. */
export async function submitNews(db: Db, actor: SessionUser | null, id: string) {
  requireMember(actor);
  const old = await loadOwn(db, actor, id);
  if (old.status === "published") throw new AppError("conflict", "This post is already published.");
  if (old.status === "submitted") return old;
  if (!old.body || old.body.trim().length < 200) throw new AppError("invalid_input", "Write the full post first (at least a few paragraphs).");
  if (NEEDS_SOURCES.includes(old.kind) && !old.sources) throw new AppError("invalid_input", "Add your sources: where the paper, protocol or incident details come from.");
  const [item] = await db.update(news).set({ status: "submitted", submittedAt: new Date(), updatedAt: new Date() }).where(eq(news.id, id)).returning();
  return item;
}

/** Takes a post back out of the review queue to keep working on it. */
export async function withdrawNews(db: Db, actor: SessionUser | null, id: string) {
  requireMember(actor);
  const old = await loadOwn(db, actor, id);
  if (old.status !== "submitted") throw new AppError("conflict", "Only a post waiting for review can be withdrawn.");
  const [item] = await db.update(news).set({ status: "draft", updatedAt: new Date() }).where(eq(news.id, id)).returning();
  return item;
}

/**
 * The admin approves a submitted post (it goes live today, dated today) or sends it back with a
 * note saying what to change. Either way the note is kept on the post for the author.
 */
export async function reviewNews(db: Db, actor: SessionUser | null, id: string, input: { decision: z.infer<typeof newsReviewInput>["decision"]; note?: string | null }) {
  requireAdmin(actor);
  const old = await loadOwn(db, actor, id);
  if (old.status !== "submitted") throw new AppError("conflict", "This post is not waiting for review.");
  if (input.decision === "reject" && !input.note) throw new AppError("invalid_input", "Tell the author what to change.");
  const [item] = await db
    .update(news)
    .set({
      status: input.decision === "approve" ? "published" : "rejected",
      ...(input.decision === "approve" ? { publishedOn: labToday() } : {}),
      reviewNote: input.note ?? null,
      reviewedBy: actor.id,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(news.id, id))
    .returning();
  return item;
}

/** Admins delete anything; authors may delete their own post until it is published. */
export async function deleteNews(db: Db, actor: SessionUser | null, id: string) {
  requireMember(actor);
  const old = await loadOwn(db, actor, id);
  if (!isAdmin(actor) && old.status === "published") throw new AppError("forbidden", "This post is published. Ask an admin to take it down.");
  await db.delete(news).where(eq(news.id, id));
}

/**
 * Who wrote what, for the admin (e.g. to give course credit): per author, posts by state and the
 * date of their latest published post. Authors without any post are not listed.
 */
export async function authorStats(db: Db, actor: SessionUser | null) {
  requireAdmin(actor);
  const n = (status: string) => sql<number>`count(*) filter (where ${news.status} = ${status})::int`;
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      published: n("published"),
      submitted: n("submitted"),
      rejected: n("rejected"),
      drafts: n("draft"),
      lastPublished: sql<string | null>`max(${news.publishedOn}) filter (where ${news.status} = 'published')`,
    })
    .from(news)
    .innerJoin(users, eq(users.id, news.authorId))
    .groupBy(users.id, users.name, users.email, users.role)
    .orderBy(desc(n("published")), asc(users.name));
}

/** Published posts of one author, for their record on the admin page. */
export async function publishedBy(db: Db, authorIds: string[]) {
  if (!authorIds.length) return [];
  return db
    .select({ authorId: news.authorId, title: news.title, slug: news.slug, publishedOn: news.publishedOn })
    .from(news)
    .where(and(inArray(news.authorId, authorIds), eq(news.status, "published")))
    .orderBy(desc(news.publishedOn));
}

export const KIND_LABEL: Record<NewsKind, string> = {
  news: "News",
  award: "Award",
  paper: "Paper accepted",
  event: "Event",
  protocol: "Protocol",
  paper_review: "Paper review",
  incident: "Incident analysis",
  article: "Article",
};

/** To the admins: a member submitted a post. */
export function renderSubmittedMail(post: { title: string; summary: string; kind: NewsKind }, author: string, to: { email: string }, siteUrl: string): Mail {
  const subject = `[Blockchainist] Post to review: ${post.title}`;
  const text = [`${author} submitted a post for review.`, "", `${KIND_LABEL[post.kind]}: ${post.title}`, post.summary, "", `Read and approve or send back: ${siteUrl}/admin/posts`].join("\n");
  const html = shell(
    `<p style="font:700 20px/1.2 Arial,sans-serif">${esc(author)} submitted a post</p>` +
      `<div style="margin:12px 0;padding:14px 16px;border:2px solid #16140f;border-radius:12px;background:#fff"><p style="margin:0 0 4px;font:12px Arial,sans-serif;color:#555">${esc(KIND_LABEL[post.kind])}</p><p style="margin:0 0 6px;font:700 16px Arial,sans-serif">${esc(post.title)}</p><p style="margin:0;font:14px/1.5 Arial,sans-serif">${esc(post.summary)}</p></div>` +
      `<p>${button(`${siteUrl}/admin/posts`, "Read and review")}</p>`,
    "Blockchainist lab · sent to admins when a member submits a post",
  );
  return { to: to.email, subject, text, html };
}

/** To the author: their post was approved or sent back. */
export function renderReviewMail(
  post: { title: string; slug: string; id: string; status: string; reviewNote: string | null },
  to: { email: string; name: string },
  reviewerName: string,
  siteUrl: string,
): Mail {
  const ok = post.status === "published";
  const url = ok ? `${siteUrl}/news/${post.slug}` : `${siteUrl}/app/posts/${post.id}`;
  const subject = ok ? `[Blockchainist] Bài của bạn đã được đăng: ${post.title}` : `[Blockchainist] Bài cần chỉnh sửa: ${post.title}`;
  const lead = ok ? `Bài "${post.title}" đã được duyệt và đăng lên trang chủ.` : `Bài "${post.title}" cần chỉnh sửa trước khi đăng.`;
  const text = [`Chào ${to.name},`, "", lead, ...(post.reviewNote ? ["", `Nhận xét của ${reviewerName}:`, post.reviewNote] : []), "", url].join("\n");
  const html = shell(
    `<p style="font:16px/1.5 Arial,sans-serif">Chào ${esc(to.name)},</p><p style="font:16px/1.5 Arial,sans-serif">${esc(lead)}</p>` +
      (post.reviewNote
        ? `<div style="margin:12px 0;padding:14px 16px;border:2px solid #16140f;border-radius:12px;background:#fff"><p style="margin:0 0 4px;font:12px Arial,sans-serif;color:#555">Nhận xét của ${esc(reviewerName)}</p><p style="margin:0;font:15px/1.6 Arial,sans-serif;white-space:pre-line;overflow-wrap:anywhere">${esc(post.reviewNote)}</p></div>`
        : "") +
      `<p>${button(url, ok ? "Xem bài" : "Sửa bài")}</p>`,
    `Blockchainist lab · bạn nhận email này vì đã gửi bài trên ${esc(siteHost(siteUrl))}`,
  );
  return { to: to.email, subject, text, html };
}
