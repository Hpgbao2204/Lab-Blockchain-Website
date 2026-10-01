import { body, route } from "@/lib/api/handler";
import { getProfileForEdit, saveProfile } from "@/server/services/profiles";
import { profileInput } from "@/server/validation";

/** The profile editor's data (own profile, or anyone's for the admin). `me` means the signed-in user. */
export const GET = route<{ userId: string }>(async ({ db, user, params }) => getProfileForEdit(db, user, params.userId === "me" ? (user?.id ?? "") : params.userId));

/** Saves the whole profile: CV sections, portfolio link, template, and whether it is public. */
export const PUT = route<{ userId: string }>(async ({ db, user, req, params }) =>
  saveProfile(db, user, params.userId === "me" ? (user?.id ?? "") : params.userId, await body(req, profileInput)),
);
