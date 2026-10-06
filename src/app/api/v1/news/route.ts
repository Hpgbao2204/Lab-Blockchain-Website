import { body, route } from "@/lib/api/handler";
import { createNews, listMyPosts, listNews, type NewsKind } from "@/server/services/news";
import { newsInput, newsKinds } from "@/server/validation";

/**
 * Published posts, newest first; `?kind=paper_review` for one kind. `?mine=1` lists the signed-in
 * member's own posts in every state; admins may add `?all=1` to include everyone's drafts,
 * posts waiting for review and scheduled items.
 */
export const GET = route(async ({ db, user, req }) => {
  const q = new URL(req.url).searchParams;
  if (q.get("mine") === "1") return listMyPosts(db, user);
  const limit = Math.min(Math.max(Number(q.get("limit")) || 50, 1), 100);
  const kind = (newsKinds as readonly string[]).includes(q.get("kind") ?? "") ? (q.get("kind") as NewsKind) : undefined;
  return listNews(db, user, { all: q.get("all") === "1", limit, kind });
});

/** Members create a draft; admins publish directly unless they send `status: "draft"`. */
export const POST = route(async ({ db, user, req }) => createNews(db, user, await body(req, newsInput)));
