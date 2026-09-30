import { body, route } from "@/lib/api/handler";
import { AppError } from "@/server/errors";
import { getStorage } from "@/server/storage";
import { MAX_UPLOAD_BYTES, completeUpload, listAttachments, uploadAttachment } from "@/server/services/attachments";
import { uploadCompleteInput } from "@/server/validation";

export const GET = route<{ id: string }>(async ({ db, user, params }) => listAttachments(db, user, params.id));

/**
 * Either multipart/form-data with `file` (PDF or image, ≤ 10 MB) and optional `taskId`, or JSON
 * `{ key, name, taskId? }` to finish a direct upload started at `/groups/:id/attachments/direct`.
 */
export const POST = route<{ id: string }>(async ({ db, user, req, params }) => {
  if (req.headers.get("content-type")?.startsWith("application/json")) {
    return completeUpload(db, getStorage(), user, params.id, await body(req, uploadCompleteInput));
  }
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
