import { eq, lt, sql } from "drizzle-orm";
import type { Db } from "../db/client";
import { rateLimits } from "../db/schema";

/**
 * Counts a hit for `key` and says whether it is still within `max` per window. Stored in
 * Postgres, so serverless instances share one counter; the upsert is a single atomic statement.
 */
export async function rateLimit(db: Db, key: string, max = 8, windowMs = 10 * 60_000): Promise<boolean> {
  const resetAt = new Date(Date.now() + windowMs);
  const [row] = await db
    .insert(rateLimits)
    .values({ key, count: 1, resetAt })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${rateLimits.resetAt} < now() then 1 else ${rateLimits.count} + 1 end`,
        resetAt: sql`case when ${rateLimits.resetAt} < now() then excluded.reset_at else ${rateLimits.resetAt} end`,
      },
    })
    .returning({ count: rateLimits.count });
  // opportunistic cleanup of expired windows
  if (Math.random() < 0.05) await db.delete(rateLimits).where(lt(rateLimits.resetAt, new Date()));
  return row.count <= max;
}

export async function resetRateLimit(db: Db, key: string) {
  await db.delete(rateLimits).where(eq(rateLimits.key, key));
}
