import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { attachments, tasks, users } from "../db/schema";
import { AppError } from "../errors";
import type { SessionUser } from "../auth/sessions";
import type { Storage } from "../storage";
import { groupAccess } from "./groups";
import { canWorkOn } from "./links";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Only these types are accepted, and only when the file's first bytes agree with the type. */
const SIGNATURES: { mime: string; ext: string; test: (b: Uint8Array) => boolean }[] = [
  { mime: "application/pdf", ext: "pdf", test: (b) => ascii(b, 0, 5) === "%PDF-" },
  { mime: "image/png", ext: "png", test: (b) => b[0] === 0x89 && ascii(b, 1, 3) === "PNG" },
  { mime: "image/jpeg", ext: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/gif", ext: "gif", test: (b) => ascii(b, 0, 4) === "GIF8" },
  { mime: "image/webp", ext: "webp", test: (b) => ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP" },
];

function ascii(b: Uint8Array, start: number, len: number) {
  return String.fromCharCode(...b.subarray(start, start + len));
}

export function sniffType(bytes: Uint8Array) {
  return SIGNATURES.find((s) => s.test(bytes)) ?? null;
}

function cleanName(name: string, ext: string) {
  const base = name.replace(/[/\\]/g, "_").replace(/[^\p{L}\p{N} ._()-]/gu, "").trim().slice(0, 120) || "file";
  return base.toLowerCase().endsWith(`.${ext}`) || (ext === "jpg" && /\.jpe?g$/i.test(base)) ? base : `${base}.${ext}`;
}

export type AttachmentView = Awaited<ReturnType<typeof listAttachments>>[number];

export async function listAttachments(db: Db, actor: SessionUser | null, groupId: string) {
  await groupAccess(db, actor, groupId);
  return db
    .select({
      id: attachments.id,
      taskId: attachments.taskId,
      filename: attachments.filename,
      mime: attachments.mime,
      size: attachments.size,
      createdAt: attachments.createdAt,
      uploader: { id: users.id, name: users.name },
    })
    .from(attachments)
    .leftJoin(users, eq(users.id, attachments.uploaderId))
    .where(eq(attachments.groupId, groupId))
    .orderBy(desc(attachments.createdAt));
}

/** Any member can share files on their group's wall; files on a task follow the task's link rule. */
async function checkUpload(db: Db, actor: SessionUser | null, groupId: string, taskId?: string | null) {
  const access = await groupAccess(db, actor, groupId);
  if (taskId) {
    const [t] = await db.select({ id: tasks.id }).from(tasks).where(and(eq(tasks.id, taskId), eq(tasks.groupId, groupId)));
    if (!t) throw new AppError("not_found", "Task not found.");
    if (!(await canWorkOn(db, actor!, access, taskId))) throw new AppError("forbidden", "You can only attach files to tasks you work on.");
  }
  return actor!;
}

function checkSize(size: number) {
  if (size <= 0) throw new AppError("invalid_input", "The file is empty.");
  if (size > MAX_UPLOAD_BYTES) throw new AppError("invalid_input", "Files can be at most 10 MB.");
}

const WRONG_TYPE = "Only PDF and images (PNG, JPEG, GIF, WebP) can be attached.";

async function record(db: Db, actor: SessionUser, groupId: string, taskId: string | null | undefined, name: string, type: { mime: string; ext: string }, size: number, storageKey: string) {
  const [a] = await db
    .insert(attachments)
    .values({ groupId, taskId: taskId ?? null, uploaderId: actor.id, filename: cleanName(name, type.ext), mime: type.mime, size, storageKey })
    .returning();
  return a;
}

/** Upload through the API (local disk, tests, small files). */
export async function uploadAttachment(
  db: Db,
  storage: Storage,
  actor: SessionUser | null,
  groupId: string,
  file: { name: string; bytes: Uint8Array },
  taskId?: string | null,
) {
  const user = await checkUpload(db, actor, groupId, taskId);
  checkSize(file.bytes.byteLength);
  const type = sniffType(file.bytes);
  if (!type) throw new AppError("invalid_input", WRONG_TYPE);
  const storageKey = randomUUID();
  await storage.put(storageKey, file.bytes, type.mime);
  try {
    return await record(db, user, groupId, taskId, file.name, type, file.bytes.byteLength, storageKey);
  } catch (e) {
    await storage.remove(storageKey);
    throw e;
  }
}

/** Keys for direct uploads name the group and uploader, so a finished upload can only be claimed by them. */
const directKeyPrefix = (groupId: string, userId: string) => `${groupId}-${userId}-`;

/**
 * Step 1 of a direct upload: checks permission, size and declared type, then returns a signed URL
 * the browser PUTs the file to. Returns `null` when the storage driver cannot do direct uploads.
 */
export async function prepareUpload(
  db: Db,
  storage: Storage,
  actor: SessionUser | null,
  groupId: string,
  input: { size: number; mime: string; taskId?: string | null },
) {
  const user = await checkUpload(db, actor, groupId, input.taskId);
  if (!storage.signedPut) return null;
  checkSize(input.size);
  if (!SIGNATURES.some((s) => s.mime === input.mime)) throw new AppError("invalid_input", WRONG_TYPE);
  const key = directKeyPrefix(groupId, user.id) + randomUUID();
  return { key, url: await storage.signedPut(key, input.mime), contentType: input.mime };
}

/** Step 2: the file is in the bucket; check its real size and content before listing it. */
export async function completeUpload(
  db: Db,
  storage: Storage,
  actor: SessionUser | null,
  groupId: string,
  input: { key: string; name: string; taskId?: string | null },
) {
  const user = await checkUpload(db, actor, groupId, input.taskId);
  const prefix = directKeyPrefix(groupId, user.id);
  const id = input.key.slice(prefix.length);
  if (!input.key.startsWith(prefix) || !/^[0-9a-f-]{36}$/.test(id)) throw new AppError("invalid_input", "Unknown upload.");
  const info = await storage.inspect(input.key, 16);
  if (!info) throw new AppError("invalid_input", "The upload did not finish. Try again.");
  const type = sniffType(info.head);
  try {
    checkSize(info.size);
    if (!type) throw new AppError("invalid_input", WRONG_TYPE);
    return await record(db, user, groupId, input.taskId, input.name, type, info.size, input.key);
  } catch (e) {
    // A rejected file (or a key claimed twice) must not stay in the bucket.
    const [taken] = await db.select({ id: attachments.id }).from(attachments).where(eq(attachments.storageKey, input.key));
    if (!taken) await storage.remove(input.key);
    throw e;
  }
}

async function loadAttachment(db: Db, actor: SessionUser | null, id: string) {
  const [a] = await db.select().from(attachments).where(eq(attachments.id, id)).limit(1);
  if (!a) throw new AppError("not_found", "File not found.");
  const access = await groupAccess(db, actor, a.groupId);
  return { attachment: a, access };
}

/** Downloads go through the same group check as the wall, so a file link is useless to outsiders. */
export async function readAttachment(db: Db, storage: Storage, actor: SessionUser | null, id: string) {
  const { attachment } = await loadAttachment(db, actor, id);
  const bytes = await storage.get(attachment.storageKey);
  if (!bytes) throw new AppError("not_found", "File not found.");
  return { attachment, bytes };
}

/** A signed bucket URL for the file, or `null` when the storage driver serves bytes itself. */
export async function signedDownload(db: Db, storage: Storage, actor: SessionUser | null, id: string, download: boolean) {
  const { attachment } = await loadAttachment(db, actor, id);
  if (!storage.signedGet) return null;
  return storage.signedGet(attachment.storageKey, { filename: attachment.filename, contentType: attachment.mime, download });
}

export async function deleteAttachment(db: Db, storage: Storage, actor: SessionUser | null, id: string) {
  const { attachment, access } = await loadAttachment(db, actor, id);
  if (!access.canManage && attachment.uploaderId !== actor!.id) throw new AppError("forbidden", "Only the uploader, a lead or the admin can remove a file.");
  await db.delete(attachments).where(eq(attachments.id, id));
  await storage.remove(attachment.storageKey);
}
