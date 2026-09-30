import "server-only";
import { createDb, type Db } from "./client";

export type { Db };

const g = globalThis as unknown as { __db?: Promise<Db> };

/**
 * One database per server process. `DATABASE_URL` (any hosted Postgres: Supabase, Neon, …)
 * in production; without it, an embedded PGlite file under `.data/` so the app runs locally
 * with no setup.
 */
export function getDb(): Promise<Db> {
  g.__db ??= createDb({ url: process.env.DATABASE_URL, dir: process.env.PGLITE_DIR ?? ".data/pglite" });
  return g.__db;
}
