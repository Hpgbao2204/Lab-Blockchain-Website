import { body, route } from "@/lib/api/handler";
import { deleteNews, getNews, updateNews } from "@/server/services/news";
import { newsInput } from "@/server/validation";

/** GET by slug (public for published items); PATCH and DELETE by id (admin). */
export const GET = route<{ key: string }>(async ({ db, user, params }) => getNews(db, user, params.key));

export const PATCH = route<{ key: string }>(async ({ db, user, req, params }) => updateNews(db, user, params.key, await body(req, newsInput)));

export const DELETE = route<{ key: string }>(async ({ db, user, params }) => {
  await deleteNews(db, user, params.key);
  return { ok: true };
});
