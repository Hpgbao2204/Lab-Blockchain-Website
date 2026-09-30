import { z } from "zod";
import type { TeamComment, TeamResource } from "@/types/content";

const id = z.string().trim().min(1).max(128).refine((value) => !value.includes("/"));
const optionalText = (limit: number) => z.string().trim().max(limit).optional().transform((value) => value || undefined);
const externalUrl = z.string().trim().url().max(2_048).refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "http:" || protocol === "https:";
}, "Only HTTP(S) URLs are allowed");

const resourceSchema = z.object({
  teamId: id,
  title: z.string().trim().min(1).max(200),
  url: externalUrl,
  note: optionalText(4_000),
  taskId: id.optional(),
  progressId: id.optional()
}).strict().refine((input) => !(input.taskId && input.progressId), "A resource can have one target");

const resourceUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  url: externalUrl.optional(),
  note: optionalText(4_000).optional()
}).strict().refine((input) => Object.keys(input).length > 0, "Provide at least one resource update");

const commentSchema = z.object({
  teamId: id,
  targetType: z.literal("task"),
  targetId: id,
  body: z.string().trim().min(1).max(4_000)
}).strict();

const commentUpdateSchema = z.object({ body: z.string().trim().min(1).max(4_000) }).strict();

export function parseResourceInput(input: unknown): Omit<TeamResource, "id" | "authorUid" | "authorMemberId" | "createdAt" | "updatedAt"> {
  const result = resourceSchema.safeParse(input);
  if (!result.success) throw new Error("Invalid resource input");
  return result.data;
}

export function parseResourceUpdate(input: unknown): Pick<TeamResource, "title" | "url" | "note"> {
  const result = resourceUpdateSchema.safeParse(input);
  if (!result.success) throw new Error("Invalid resource update");
  return result.data as Pick<TeamResource, "title" | "url" | "note">;
}

export function parseCommentInput(input: unknown): Omit<TeamComment, "id" | "authorUid" | "authorMemberId" | "createdAt" | "updatedAt"> {
  const result = commentSchema.safeParse(input);
  if (!result.success) throw new Error("Invalid comment input");
  return result.data;
}

export function parseCommentUpdate(input: unknown): Pick<TeamComment, "body"> {
  const result = commentUpdateSchema.safeParse(input);
  if (!result.success) throw new Error("Invalid comment update");
  return result.data;
}
