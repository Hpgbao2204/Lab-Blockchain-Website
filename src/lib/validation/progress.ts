import { z } from "zod";
import type { ProgressUpdate } from "@/types/content";

const progressUpdateStatusSchema = z.enum(["not_started", "in_progress", "blocked", "completed"]);

export function isProgressUpdateStatus(value: string): value is ProgressUpdate["status"] {
  return progressUpdateStatusSchema.safeParse(value).success;
}

const url = z.string().trim().url().max(2_048);
const httpUrl = url.refine((value) => /^https?:\/\//i.test(value), "Only HTTP(S) URLs are allowed");
const shortText = z.string().trim().min(1).max(200);
const contentId = z.string().trim().min(1).max(128).refine((value) => !value.includes("/"));
const optionalLongText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .transform((value) => value || undefined);

function isValidCalendarDate(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const progressUpdateInputSchema = z
  .object({
    title: shortText,
    status: progressUpdateStatusSchema,
    goals: optionalLongText(4_000),
    note: optionalLongText(4_000),
    targetDate: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).refine(isValidCalendarDate).optional()
    ),
    links: z.array(url).max(20).optional(),
    imageUrls: z.array(httpUrl).max(5).refine((urls) => new Set(urls).size === urls.length).optional(),
    teamId: contentId,
    taskId: contentId
  })
  .strict();

const forbiddenFields = ["createdAt", "updatedAt", "updatedBy", "memberId", "id"];

function rejectForbiddenFields(input: Record<string, unknown>): void {
  for (const field of forbiddenFields) {
    if (field in input) {
      throw new Error(`Invalid progress update input`);
    }
  }
}

export function parseProgressUpdateInput(
  input: unknown,
  isUpdate = false
): Omit<ProgressUpdate, "id" | "memberId" | "createdAt" | "updatedAt" | "updatedBy"> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Invalid progress update input");
  }

  const record = input as Record<string, unknown>;
  rejectForbiddenFields(record);

  if (isUpdate && Object.keys(record).length === 0) {
    throw new Error("Invalid progress update input");
  }

  const schema = isUpdate ? progressUpdateInputSchema.partial() : progressUpdateInputSchema;
  const result = schema.safeParse(record);
  if (!result.success) {
    throw new Error("Invalid progress update input");
  }

  return result.data as Omit<ProgressUpdate, "id" | "memberId" | "createdAt" | "updatedAt" | "updatedBy">;
}
