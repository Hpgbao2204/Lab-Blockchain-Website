import { mkdirSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import * as schema from "./schema";

/** The query API is the same for every driver; PGlite's type stands in for all of them. */
export type Db = PgliteDatabase<typeof schema>;

const migrationsFolder = path.join(process.cwd(), "drizzle");

export async function createDb(opts: { url?: string; dir?: string }): Promise<Db> {
  if (opts.url) {
    const [{ default: postgres }, { drizzle }] = await Promise.all([import("postgres"), import("drizzle-orm/postgres-js")]);
    // `prepare: false` keeps it compatible with transaction poolers (Supabase/Neon pooled URLs).
    // `idle_timeout` closes idle connections ourselves before the server drops them (long AI calls).
    const sql = postgres(opts.url, { prepare: false, max: 5, idle_timeout: 20 });
    return drizzle(sql, { schema }) as unknown as Db;
  }
  if (opts.dir) mkdirSync(opts.dir, { recursive: true });
  const client = new PGlite(opts.dir);
  const db = drizzlePglite(client, { schema });
  await migratePglite(db, { migrationsFolder });
  return db;
}

/** Fresh in-memory database with the schema applied, for tests. */
export function createTestDb(): Promise<Db> {
  return createDb({});
}
