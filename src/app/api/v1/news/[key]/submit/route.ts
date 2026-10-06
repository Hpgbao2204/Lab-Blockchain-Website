import { route } from "@/lib/api/handler";
import { notifyPostSubmitted } from "@/server/jobs/notify";
import { submitNews } from "@/server/services/news";

/** The author sends their post for review; the admins get an email. */
export const POST = route<{ key: string }>(async ({ db, user, params }) => {
  const post = await submitNews(db, user, params.key);
  const mail = await notifyPostSubmitted(db, post, user!.name).catch((e) => ({ error: String(e) }));
  return { post, mail };
});
