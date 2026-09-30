import { beforeAll, describe, expect, it } from "vitest";
import { createTestDb, type Db } from "../db/client";
import { rateLimits } from "../db/schema";
import { rateLimit, resetRateLimit } from "./rate-limit";

let db: Db;
beforeAll(async () => {
  db = await createTestDb();
}, 60_000);

describe("rateLimit", () => {
  it("allows up to max hits per window, then blocks until reset", async () => {
    for (let i = 0; i < 3; i++) expect(await rateLimit(db, "k", 3)).toBe(true);
    expect(await rateLimit(db, "k", 3)).toBe(false);
    expect(await rateLimit(db, "other", 3)).toBe(true);
    await resetRateLimit(db, "k");
    expect(await rateLimit(db, "k", 3)).toBe(true);
  });

  it("starts a new window once the old one has expired", async () => {
    for (let i = 0; i < 4; i++) await rateLimit(db, "w", 3);
    await db.update(rateLimits).set({ resetAt: new Date(Date.now() - 1000) });
    expect(await rateLimit(db, "w", 3)).toBe(true);
  });
});
