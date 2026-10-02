/**
 * Runs on every Vercel build (`vercel-build`): applies pending migrations and creates the first
 * admin if there is none, so deploying needs no terminal. Without a database it only warns.
 *
 * The admin is ADMIN_EMAIL / ADMIN_NAME / ADMIN_PASSWORD. Without ADMIN_PASSWORD a temporary
 * password is printed in the build log, and it must be changed at first sign-in.
 */
import path from "node:path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import * as schema from "../src/server/db/schema";
import type { Db } from "../src/server/db/client";
import { ensureAdmin } from "../src/server/services/users";

async function main() {
  // Migrations need a direct (unpooled) connection; Neon's integration sets both.
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    console.warn("[deploy-db] No DATABASE_URL: skipping migrations. Connect a database (Vercel → Storage → Neon) and redeploy.");
    return;
  }
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    const db = drizzle(sql, { schema });
    await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
    console.log("[deploy-db] Migrations applied.");
    const email = process.env.ADMIN_EMAIL || "hpgbao@gmail.com";
    const created = await ensureAdmin(db as unknown as Db, { email, name: process.env.ADMIN_NAME || "Lab Admin", password: process.env.ADMIN_PASSWORD || undefined });
    if (!created) console.log("[deploy-db] Admin already exists.");
    else if (process.env.ADMIN_PASSWORD) console.log(`[deploy-db] Admin created: ${email} (password from ADMIN_PASSWORD).`);
    else console.log(`[deploy-db] Admin created: ${email}  temporary password: ${created}  (change it at first sign-in)`);
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error("[deploy-db] Failed:", e);
  process.exit(1);
});
