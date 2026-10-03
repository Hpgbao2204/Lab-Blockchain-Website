import { body, route } from "@/lib/api/handler";
import { createNews, listNews } from "@/server/services/news";
import { newsInput } from "@/server/validation";

/** Published news, newest first. Admins may add `?all=1` to include drafts and scheduled items. */
export const GET = route(async ({ db, user, req }) => {
  const q = new URL(req.url).searchParams;
  const limit = Math.min(Math.max(Number(q.get("limit")) || 50, 1), 100);
  return listNews(db, user, { all: q.get("all") === "1", limit });
});

export const POST = route(async ({ db, user, req }) => createNews(db, user, await body(req, newsInput)));
