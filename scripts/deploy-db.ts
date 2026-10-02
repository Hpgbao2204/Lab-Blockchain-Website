/**
 * Runs on every Vercel build (`vercel-build`): applies pending migrations and creates the first
 * admin if there is none, so deploying needs no terminal. Without a database it only warns.
 *
 * The admin is ADMIN_EMAIL / ADMIN_NAME / ADMIN_PASSWORD. Without ADMIN_PASSWORD a temporary
 * password is printed in the build log, and it must be changed at first sign-in.
 * Lost the admin password? Set ADMIN_RESET=1, redeploy, read the new temporary password in the
 * build log, then delete ADMIN_RESET (otherwise every deploy resets it again).
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
    const email = process.env.ADMIN_EMAIL || "hpgbao@gmail.com";
    const created = await ensureAdmin(db as unknown as Db, { email, name: process.env.ADMIN_NAME || "Lab Admin", password: process.env.ADMIN_PASSWORD || undefined });
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

main().catch((e) => {
  console.error("[deploy-db] Failed:", e);
  process.exit(1);
});
