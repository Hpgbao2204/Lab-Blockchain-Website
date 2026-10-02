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
  // Neon/Vercel Postgres integrations also expose the pooled URL as POSTGRES_URL.
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  // Serverless hosts have a read-only, throwaway disk, so the PGlite fallback can never work there.
  if (!url && process.env.VERCEL)
    throw new Error("DATABASE_URL is not set. Connect a Postgres database (Vercel → Storage → Neon → Connect) and redeploy; see docs/DEPLOY.md.");
  g.__db ??= createDb({ url, dir: process.env.PGLITE_DIR ?? ".data/pglite" });
  return g.__db;
}
