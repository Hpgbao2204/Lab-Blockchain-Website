import { body, route } from "@/lib/api/handler";
import { getStorage } from "@/server/storage";
import { prepareUpload } from "@/server/services/attachments";
import { uploadRequestInput } from "@/server/validation";

/**
 * Starts a direct upload: `{ size, mime, taskId? }` → `{ direct: true, key, url, contentType }`.
 * PUT the file to `url` with that Content-Type, then POST `{ key, name, taskId }` to
 * `/groups/:id/attachments`. `{ direct: false }` means: send multipart to that endpoint instead.
 */
export const POST = route<{ id: string }>(async ({ db, user, req, params }) => {
  const ticket = await prepareUpload(db, getStorage(), user, params.id, await body(req, uploadRequestInput));
  return ticket ? { direct: true, ...ticket } : { direct: false };
});
