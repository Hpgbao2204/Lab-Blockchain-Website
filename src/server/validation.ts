import { z } from "zod";
import { PASSWORD_MIN } from "./auth/password";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    // undefined = leave unchanged (patches); "" or null = clear
    .transform((v) => (v === undefined ? undefined : v || null));

export const loginInput = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1).max(200) });
export const changePasswordInput = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(PASSWORD_MIN, `At least ${PASSWORD_MIN} characters`).max(200),
});

export const createUserInput = z.object({
  email: z.string().trim().toLowerCase().email(),
  name: text(120),
  title: optionalText(160),
  role: z.enum(["admin", "member"]).default("member"),
});
export const updateUserInput = z.object({
  name: text(120).optional(),
  title: optionalText(160),
  role: z.enum(["admin", "member"]).optional(),
  active: z.boolean().optional(),
});

export const groupInput = z.object({
  name: text(120),
  description: optionalText(2000),
  paperTitle: optionalText(300),
  targetVenue: optionalText(200),
  submissionDeadline: isoDate.optional().nullable(),
  period: isoDate.optional().nullable(),
  status: z.enum(["active", "archived"]).optional(),
});
export const groupPatch = groupInput.partial();
export const membersInput = z.object({
  members: z.array(z.object({ userId: z.string().uuid(), role: z.enum(["lead", "member"]).default("member") })).max(200),
});

export const postInput = z.object({
  body: text(5000),
  kind: z.enum(["note", "announcement"]).default("note"),
  pinned: z.boolean().default(false),
});

export const taskInput = z.object({
  title: text(200),
  description: optionalText(5000),
  dueDate: isoDate,
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  assigneeIds: z.array(z.string().uuid()).max(100).default([]),
});
export const taskPatch = z.object({
  title: text(200).optional(),
  description: optionalText(5000),
  dueDate: isoDate.optional(),
  priority: z.enum(["low", "normal", "high"]).optional(),
  status: z.enum(["todo", "doing", "review", "done"]).optional(),
  assigneeIds: z.array(z.string().uuid()).max(100).optional(),
});

export const commentInput = z.object({ body: text(3000) });
