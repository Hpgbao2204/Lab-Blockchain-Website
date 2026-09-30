import { route } from "@/lib/api/handler";
import { resetPassword } from "@/server/services/users";

export const POST = route<{ id: string }>(async ({ db, user, params }) => resetPassword(db, user, params.id));
