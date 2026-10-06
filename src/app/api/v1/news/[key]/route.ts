import { body, route } from "@/lib/api/handler";
import { deleteNews, getNews, getPostById, updateNews } from "@/server/services/news";
import { newsInput } from "@/server/validation";

const isId = (k: string) => /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(k);

/** GET by slug or id (public for live posts; author and admins otherwise); PATCH and DELETE by id. */
export const GET = route<{ key: string }>(async ({ db, user, params }) => (isId(params.key) ? getPostById(db, user, params.key) : getNews(db, user, params.key)));

export const PATCH = route<{ key: string }>(async ({ db, user, req, params }) => updateNews(db, user, params.key, await body(req, newsInput)));

export const DELETE = route<{ key: string }>(async ({ db, user, params }) => {
  await deleteNews(db, user, params.key);
  return { ok: true };
});
