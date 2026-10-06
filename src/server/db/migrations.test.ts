import { readFileSync } from "node:fs";
import path from "node:path";
import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createTestDb } from "./client";
import { news } from "./schema";

describe("migrations", () => {
  it("0011 restores news.published where an early preview build dropped it, and is a no-op otherwise", async () => {
    const db = await createTestDb();
    const restore = readFileSync(path.join(process.cwd(), "drizzle/0011_restore_news_published.sql"), "utf8");
    await db.execute(sql.raw(restore)); // column present: nothing happens
    await db.execute(sql`ALTER TABLE "news" DROP COLUMN "published"`);
    await expect(db.insert(news).values({ slug: "a", title: "A", summary: "s", publishedOn: "2026-10-06" })).rejects.toThrow();
    await db.execute(sql.raw(restore));
    const [row] = await db.insert(news).values({ slug: "b", title: "B", summary: "s", publishedOn: "2026-10-06" }).returning();
    expect(row.slug).toBe("b");
  }, 30_000);
});
