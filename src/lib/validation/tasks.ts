import { z } from "zod";
import type { Task, TaskStatus } from "@/types/content";

const id = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .refine((value) => !value.includes("/"));
const targetDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .transform((value) => value || undefined);
const description = z
  .string()
  .trim()
  .max(4_000)
  .optional()
  .transform((value) => value || undefined);
const taskInput = z
  .object({
    teamId: id,
    title: z.string().trim().min(1).max(200),
    description,
    targetDate,
  })
  .strict();

const taskUpdate = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: description.optional(),
    targetDate: targetDate.optional(),
    status: z.enum(["in_progress", "blocked", "completed"]).optional(),
  })
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Provide at least one task update",
  );

export function parseTaskInput(input: unknown): Pick<Task, "teamId" | "title" | "description" | "targetDate"> & { status: TaskStatus } {
  const result = taskInput.safeParse(input);
  if (!result.success) {
    const message = result.error.issues[0]?.message;
    throw new Error(message || "Invalid task input");
  }
  return { ...result.data, status: "in_progress" };
}

export function parseTaskUpdate(
  input: unknown,
): Partial<
  Pick<Task, "title" | "description" | "targetDate" | "status">
> {
  const result = taskUpdate.safeParse(input);
  if (!result.success) {
    const message = result.error.issues[0]?.message;
    throw new Error(message || "Invalid task update");
  }
  return result.data;
}
