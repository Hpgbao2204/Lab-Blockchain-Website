import { route } from "@/lib/api/handler";
import { getStorage } from "@/server/storage";
import { deleteAttachment, readAttachment } from "@/server/services/attachments";

/** Streams the file after the same group check as the wall. Images and PDFs open inline. */
export const GET = route<{ id: string }>(async ({ db, user, params, req }) => {
  const { attachment, bytes } = await readAttachment(db, getStorage(), user, params.id);
  const download = new URL(req.url).searchParams.has("download");
  return new Response(new Blob([bytes as BlobPart]), {
    headers: {
      "Content-Type": attachment.mime,
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(attachment.filename)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    },
  });
});

export const DELETE = route<{ id: string }>(async ({ db, user, params }) => {
  await deleteAttachment(db, getStorage(), user, params.id);
  return { ok: true };
});
