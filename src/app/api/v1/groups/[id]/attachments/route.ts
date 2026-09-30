import { route } from "@/lib/api/handler";
import { AppError } from "@/server/errors";
import { getStorage } from "@/server/storage";
import { MAX_UPLOAD_BYTES, listAttachments, uploadAttachment } from "@/server/services/attachments";

export const GET = route<{ id: string }>(async ({ db, user, params }) => listAttachments(db, user, params.id));

/** multipart/form-data: `file` (PDF or image, ≤ 10 MB) and optional `taskId`. */
export const POST = route<{ id: string }>(async ({ db, user, req, params }) => {
  if (Number(req.headers.get("content-length") ?? 0) > MAX_UPLOAD_BYTES + 64 * 1024) throw new AppError("invalid_input", "Files can be at most 10 MB.");
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new AppError("invalid_input", "Send the file as multipart/form-data.");
  }
  const file = form.get("file");
  if (!(file instanceof File)) throw new AppError("invalid_input", "Choose a file to upload.");
  const taskId = form.get("taskId");
  const bytes = new Uint8Array(await file.arrayBuffer());
  return uploadAttachment(db, getStorage(), user, params.id, { name: file.name, bytes }, typeof taskId === "string" && taskId ? taskId : null);
});
