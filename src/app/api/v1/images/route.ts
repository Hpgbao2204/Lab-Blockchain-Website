import { route } from "@/lib/api/handler";
import { AppError } from "@/server/errors";
import { getStorage } from "@/server/storage";
import { MAX_IMAGE_BYTES, uploadImage } from "@/server/services/images";

/** Signed-in members: multipart/form-data with `file` (PNG, JPEG, GIF or WebP, ≤ 4 MB). Returns `{ url }` for posts. */
export const POST = route(async ({ user, req }) => {
  if (!user) throw new AppError("unauthorized", "Sign in first.");
  if (Number(req.headers.get("content-length") ?? 0) > MAX_IMAGE_BYTES + 64 * 1024) throw new AppError("invalid_input", "Images can be at most 4 MB.");
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new AppError("invalid_input", "Send the image as multipart/form-data.");
  }
  const file = form.get("file");
  if (!(file instanceof File)) throw new AppError("invalid_input", "Choose an image to upload.");
  return uploadImage(getStorage(), user, new Uint8Array(await file.arrayBuffer()));
});
