import { z } from "zod";
import { body, route } from "@/lib/api/handler";
import { deletePublication, setPublicationHidden, updatePublication } from "@/server/services/publications";
import { publicationInput } from "@/server/validation";

const patchInput = z.union([z.object({ hidden: z.boolean() }).strict(), publicationInput]);

/** `{ hidden }` hides or shows any paper; a full paper body edits one added by hand. */
export const PATCH = route<{ id: string }>(async ({ db, user, req, params }) => {
  const input = await body(req, patchInput);
  return "hidden" in input ? setPublicationHidden(db, user, params.id, input.hidden) : updatePublication(db, user, params.id, input);
});

export const DELETE = route<{ id: string }>(async ({ db, user, params }) => {
  await deletePublication(db, user, params.id);
  return { ok: true };
});
