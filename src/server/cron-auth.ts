import { timingSafeEqual } from "node:crypto";
import { fail } from "@/lib/api/respond";

/** Scheduled jobs send `Authorization: Bearer $CRON_SECRET` (Vercel Cron does this itself). Returns an error response, or null when allowed. */
export function checkCron(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return fail(503, "not_configured", "CRON_SECRET is not set.");
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  if (given.length !== want.length || !timingSafeEqual(given, want)) return fail(401, "unauthorized", "Bad cron secret.");
  return null;
}
