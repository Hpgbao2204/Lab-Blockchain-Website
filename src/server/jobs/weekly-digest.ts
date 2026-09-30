import "server-only";
import type { Db } from "../db/client";
import { sendMail } from "../mail";
import { buildDigests, renderDigest } from "../services/digest";

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function runWeeklyDigest(db: Db, today: string, opts: { dryRun?: boolean } = {}) {
  const digests = await buildDigests(db, today);
  const results = [];
  for (const d of digests) {
    const mail = renderDigest(d, siteUrl(), today);
    const r = opts.dryRun ? { sent: false } : await sendMail(mail);
    results.push({ to: d.email, name: d.name, overdue: d.overdue.length, thisWeek: d.thisWeek.length, ...r });
  }
  return { today, dryRun: !!opts.dryRun, recipients: results.length, sent: results.filter((r) => r.sent).length, results };
}
