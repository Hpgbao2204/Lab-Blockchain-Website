/**
 * Runs on every Vercel build (`vercel-build`): applies pending migrations and creates the first
 * admin if there is none, so deploying needs no terminal. Without a database it only warns.
 *
 * The admin is ADMIN_EMAIL / ADMIN_NAME / ADMIN_PASSWORD. Without ADMIN_PASSWORD a temporary
 * password is printed in the build log, and it must be changed at first sign-in.
 * Lost the admin password? Set ADMIN_RESET=1, redeploy, read the new temporary password in the
 * build log, then delete ADMIN_RESET (otherwise every deploy resets it again).
 * Start over with an empty site? Set RESET_DATABASE to a new value (e.g. today's date) and
 * redeploy: every table is emptied once for that value, then the admin above is created again.
 */
import path from "node:path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import * as schema from "../src/server/db/schema";
import type { Db } from "../src/server/db/client";
import { ensureAdmin, recoverAdmin } from "../src/server/services/users";

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
    await resetOnce(sql, process.env.RESET_DATABASE);
    const email = process.env.ADMIN_EMAIL || "dungtrt@uit.edu.vn";
    const created = await ensureAdmin(db as unknown as Db, { email, name: process.env.ADMIN_NAME || "Tran Tuan Dung", password: process.env.ADMIN_PASSWORD || undefined });
    if (!created && process.env.ADMIN_RESET === "1") {
      const r = await recoverAdmin(db as unknown as Db, email);
      if (r) console.log(`[deploy-db] ADMIN_RESET: ${r.email}  temporary password: ${r.password}  (sign in, change it, then DELETE the ADMIN_RESET variable)`);
    } else if (!created) console.log("[deploy-db] Admin already exists. (Lost the password? Set ADMIN_RESET=1 and redeploy.)");
    else if (process.env.ADMIN_PASSWORD) console.log(`[deploy-db] Admin created: ${email} (password from ADMIN_PASSWORD).`);
    else console.log(`[deploy-db] Admin created: ${email}  temporary password: ${created}  (change it at first sign-in)`);
  } finally {
    await sql.end();
  }
}

/** Empties every app table, once per RESET_DATABASE value (remembered in app_meta, which is kept). */
async function resetOnce(sql: postgres.Sql, token: string | undefined) {
  if (!token) return;
  await sql`create table if not exists app_meta (key text primary key, value text not null)`;
  const [done] = await sql`select value from app_meta where key = 'reset_database'`;
  if (done?.value === token) return console.log(`[deploy-db] RESET_DATABASE=${token} was already applied; nothing deleted.`);
  const tables = await sql<{ name: string }[]>`select tablename as name from pg_tables where schemaname = 'public' and tablename <> 'app_meta'`;
  if (tables.length) await sql.unsafe(`truncate ${tables.map((t) => `"${t.name}"`).join(", ")} restart identity cascade`);
  await sql`insert into app_meta (key, value) values ('reset_database', ${token}) on conflict (key) do update set value = excluded.value`;
  console.log(`[deploy-db] RESET_DATABASE=${token}: emptied ${tables.length} tables (accounts, groups, wall, meetings, profiles…).`);
}

main().catch((e) => {
  console.error("[deploy-db] Failed:", e);
  process.exit(1);
});
