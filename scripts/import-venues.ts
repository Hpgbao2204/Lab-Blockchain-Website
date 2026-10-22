/**
 * Loads the conference and/or journal CSV into the venue search, the same way /admin/venues
 * does: upsert in chunks, then remove venues of that kind the file no longer lists.
 *
 *   npm run venues:import -- conferences.csv journals.csv          # local PGlite (.data/pglite)
 *   DATABASE_URL=… npm run venues:import -- journals.csv            # a hosted database
 *   npm run venues:import -- --keep journals.csv                    # add/update only, remove nothing
 *
 * The kind of each file is read from its header (conference_id or journal_id).
 */
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createDb } from "../src/server/db/client";
import { parseCsv, venueFileKind } from "../src/lib/venues/csv";
import { finishVenueImport, importVenueRows } from "../src/server/services/venues";
import type { SessionUser } from "../src/server/auth/sessions";

async function main() {
  const args = process.argv.slice(2);
  const keep = args.includes("--keep");
  const files = args.filter((a) => !a.startsWith("--"));
  if (!files.length) throw new Error("Usage: npm run venues:import -- [--keep] <conferences.csv> [journals.csv]");
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  const db = await createDb({ url, dir: process.env.PGLITE_DIR ?? ".data/pglite" });
  if (url) {
    // hosted databases are migrated by the deploy; make sure this one has the venues table
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    await migrate(db as never, { migrationsFolder: "drizzle" });
  }
  // the services check for an admin; this script runs with the operator's own database access
  const operator = { id: "00000000-0000-0000-0000-000000000000", role: "admin", name: "import script" } as SessionUser;

  for (const file of files) {
    const { columns, rows } = parseCsv(readFileSync(file, "utf8"));
    const kind = venueFileKind(columns);
    if (!kind) throw new Error(`${file}: no conference_id or journal_id column`);
    const run = randomUUID();
    const sum = { inserted: 0, updated: 0, skipped: 0 };
    for (let i = 0; i < rows.length; i += 1000) {
      const r = await importVenueRows(db, operator, { kind, run, columns, rows: rows.slice(i, i + 1000) });
      sum.inserted += r.inserted;
      sum.updated += r.updated;
      sum.skipped += r.skipped;
      process.stdout.write(`\r${file}: ${Math.min(i + 1000, rows.length)}/${rows.length}`);
    }
    const done = await finishVenueImport(db, operator, { kind, run, prune: !keep });
    console.log(`\n${kind}s: ${sum.inserted} new, ${sum.updated} updated, ${sum.skipped} skipped, ${done.removed} removed (${done.total} in the file)`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
