import { route } from "@/lib/api/handler";
import { authorStats } from "@/server/services/news";

const csvCell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n]|^[=+\-@]/.test(s) ? `"${s.replace(/^([=+\-@])/, "'$1").replace(/"/g, '""')}"` : s;
};

/** Admin: posts per author by state (published, waiting, sent back, drafts) and their latest post date. `?format=csv` for a spreadsheet. */
export const GET = route(async ({ db, user, req }) => {
  const rows = await authorStats(db, user);
  if (new URL(req.url).searchParams.get("format") !== "csv") return rows;
  const head = ["name", "email", "published", "waiting", "sent_back", "drafts", "latest_published"];
  const lines = rows.map((r) => [r.name, r.email, r.published, r.submitted, r.rejected, r.drafts, r.lastPublished].map(csvCell).join(","));
  return new Response("﻿" + [head.join(","), ...lines].join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="blog-authors.csv"', "Cache-Control": "no-store" },
  });
});
