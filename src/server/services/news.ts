import { and, desc, eq, like, lte, ne } from "drizzle-orm";
import type { z } from "zod";
import type { Db } from "../db/client";
import { news, type NewsItem } from "../db/schema";
import { AppError } from "../errors";
import type { SessionUser } from "../auth/sessions";
import type { newsInput } from "../validation";
import { requireAdmin } from "./users";
import { labToday } from "@/lib/weeks";

type NewsInput = z.infer<typeof newsInput>;
export type { NewsItem };

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

async function freeSlug(db: Db, title: string, exceptId?: string) {
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

/**
 * Visitors see published items dated today or earlier (Vietnam time), newest first.
 * Admins may ask for everything, including drafts and scheduled items.
 */
export async function listNews(db: Db, actor: SessionUser | null, opts: { all?: boolean; limit?: number } = {}) {
  const everything = opts.all && isAdmin(actor);
  return db
    .select()
    .from(news)
    .where(everything ? undefined : and(eq(news.published, true), lte(news.publishedOn, labToday())))
    .orderBy(desc(news.publishedOn), desc(news.createdAt))
    .limit(opts.limit ?? 100);
}

/** Drafts and future items are only found by admins; everyone else gets a 404. */
export async function getNews(db: Db, actor: SessionUser | null, slug: string) {
  const [item] = await db.select().from(news).where(eq(news.slug, slug)).limit(1);
  if (!item || (!isAdmin(actor) && (!item.published || item.publishedOn > labToday()))) throw new AppError("not_found", "News item not found.");
  return item;
}

export async function createNews(db: Db, actor: SessionUser | null, input: NewsInput) {
  requireAdmin(actor);
  const [item] = await db
    .insert(news)
    .values({ ...input, body: input.body ?? null, link: input.link ?? null, slug: await freeSlug(db, input.title), authorId: actor.id })
    .returning();
  return item;
}

/** The slug follows the title, so links change when the title does; old links then 404. */
export async function updateNews(db: Db, actor: SessionUser | null, id: string, input: NewsInput) {
  requireAdmin(actor);
  const [old] = await db.select({ title: news.title, slug: news.slug }).from(news).where(eq(news.id, id)).limit(1);
  if (!old) throw new AppError("not_found", "News item not found.");
  const slug = old.title === input.title ? old.slug : await freeSlug(db, input.title, id);
  const [item] = await db
    .update(news)
    .set({ ...input, body: input.body ?? null, link: input.link ?? null, slug, updatedAt: new Date() })
    .where(eq(news.id, id))
    .returning();
  return item;
}

export async function deleteNews(db: Db, actor: SessionUser | null, id: string) {
  requireAdmin(actor);
  const [gone] = await db.delete(news).where(eq(news.id, id)).returning({ id: news.id });
  if (!gone) throw new AppError("not_found", "News item not found.");
}
