import { body, route } from "@/lib/api/handler";
import { notifyPostReviewed } from "@/server/jobs/notify";
import { reviewNews } from "@/server/services/news";
import { newsReviewInput } from "@/server/validation";

/** Admin: `{ decision: "approve" | "reject", note? }` (a note is required to send it back). The author gets an email. */
export const POST = route<{ key: string }>(async ({ db, user, req, params }) => {
  const post = await reviewNews(db, user, params.key, await body(req, newsReviewInput));
  const mail = await notifyPostReviewed(db, post, user!.name).catch((e) => ({ error: String(e) }));
  return { post, mail };
});
