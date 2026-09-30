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

const httpUrl = z
  .string()
  .trim()
  .max(2000)
  .url("Enter a full link starting with https://")
  .refine((u) => /^https?:\/\//i.test(u), "Only http(s) links are allowed");

export const linkKinds = ["overleaf", "github", "drive", "paper", "other"] as const;
export const linkInput = z.object({
  url: httpUrl,
  label: optionalText(120),
  /** detected from the URL when omitted */
  kind: z.enum(linkKinds).optional(),
  taskId: z.string().uuid().optional().nullable(),
});

export const taskInput = z.object({
  title: text(200),
  description: optionalText(5000),
  dueDate: isoDate,
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  assigneeIds: z.array(z.string().uuid()).max(100).default([]),
  venue: optionalText(200),
  /** e.g. the Overleaf project and the call for papers, attached when the task is created */
  links: z.array(linkInput.omit({ taskId: true })).max(10).default([]),
});
export const taskPatch = z.object({
  title: text(200).optional(),
  description: optionalText(5000),
  dueDate: isoDate.optional(),
  priority: z.enum(["low", "normal", "high"]).optional(),
  status: z.enum(["todo", "doing", "review", "done"]).optional(),
  venue: optionalText(200),
  assigneeIds: z.array(z.string().uuid()).max(100).optional(),
});

export const commentInput = z.object({ body: text(3000) });

export const monthParam = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use YYYY-MM");

export const uploadRequestInput = z.object({
  size: z.number().int().positive(),
  mime: z.string().max(100),
  taskId: z.string().uuid().optional().nullable(),
});
export const uploadCompleteInput = z.object({
  key: z.string().max(200),
  name: z.string().max(300),
  taskId: z.string().uuid().optional().nullable(),
});
