import { route } from "@/lib/api/handler";
import { getStorage } from "@/server/storage";
import { deleteAttachment, readAttachment, signedDownload } from "@/server/services/attachments";

/**
 * After the same group check as the wall: redirects to a short-lived signed URL when files live
 * in a bucket, otherwise streams the bytes. Images and PDFs open inline.
 */
export const GET = route<{ id: string }>(async ({ db, user, params, req }) => {
  const download = new URL(req.url).searchParams.has("download");
  const storage = getStorage();
  const signed = await signedDownload(db, storage, user, params.id, download);
  if (signed) return new Response(null, { status: 302, headers: { Location: signed, "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
  const { attachment, bytes } = await readAttachment(db, storage, user, params.id);
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
