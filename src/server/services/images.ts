import { randomUUID } from "node:crypto";
import { AppError } from "../errors";
import type { SessionUser } from "../auth/sessions";
import type { Storage } from "../storage";
import { sniffType } from "./attachments";

/** Under Vercel's 4.5 MB request limit, since images are posted through the API. */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = { png: "image/png", jpg: "image/jpeg", gif: "image/gif", webp: "image/webp" };

/**
 * Images for blog posts (inline pictures and covers). Any signed-in member may upload; the type
 * is checked from the file's bytes. The key carries the type, so serving needs no database.
 */
export async function uploadImage(storage: Storage, actor: SessionUser | null, bytes: Uint8Array) {
  if (!actor) throw new AppError("unauthorized", "Sign in first.");
  if (!bytes.byteLength) throw new AppError("invalid_input", "The file is empty.");
  if (bytes.byteLength > MAX_IMAGE_BYTES) throw new AppError("invalid_input", "Images can be at most 4 MB.");
  const type = sniffType(bytes);
  if (!type || !IMAGE_TYPES[type.ext]) throw new AppError("invalid_input", "Only PNG, JPEG, GIF and WebP images can be uploaded.");
  const key = `img-${randomUUID()}-${type.ext}`;
  await storage.put(key, bytes, type.mime);
  return { key, url: `/api/v1/images/${key}`, mime: type.mime, size: bytes.byteLength };
}

export async function readImage(storage: Storage, key: string) {
  const m = /^img-[0-9a-f-]{36}-(png|jpg|gif|webp)$/.exec(key);
  if (!m) throw new AppError("not_found", "Image not found.");
  const bytes = await storage.get(key);
  if (!bytes) throw new AppError("not_found", "Image not found.");
  return { bytes, mime: IMAGE_TYPES[m[1]] };
}
