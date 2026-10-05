import { body, route } from "@/lib/api/handler";
import { markWallSeen, wallActivity } from "@/server/services/activity";
import { wallSeenInput } from "@/server/validation";

/** What others did on my walls since I last looked (the red dot on "My wall"). */
export const GET = route(async ({ db, user }) => wallActivity(db, user));

/** I just looked at a wall; returns the fresh counts. */
export const POST = route(async ({ db, user, req }) => {
  const { scope } = await body(req, wallSeenInput);
  await markWallSeen(db, user, scope);
  return wallActivity(db, user);
});
