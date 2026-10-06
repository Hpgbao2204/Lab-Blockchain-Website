import { route } from "@/lib/api/handler";
import { withdrawNews } from "@/server/services/news";

/** The author takes a post back out of the review queue. */
export const POST = route<{ key: string }>(async ({ db, user, params }) => withdrawNews(db, user, params.key));
