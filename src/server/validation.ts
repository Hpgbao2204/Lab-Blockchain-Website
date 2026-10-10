import { z } from "zod";
import { withoutAccents } from "@/lib/text";
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
  /** email the login details to the new account */
  notify: z.boolean().default(true),
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

const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM");
export const meetingInput = z.object({
  title: text(200),
  /** date and time in Vietnam time */
  date: isoDate,
  time: clock,
  location: optionalText(200),
  link: httpUrl.optional().nullable().or(z.literal("").transform(() => null)),
  notes: optionalText(3000),
  presenters: z.array(z.object({ userId: z.string().uuid(), topic: optionalText(300) })).max(20).default([]),
  /** email every member about it now */
  notify: z.boolean().default(true),
});

export const announcementInput = z.object({
  title: text(200),
  body: text(5000),
  notify: z.boolean().default(true),
});

const optionalUrl = httpUrl.optional().nullable().or(z.literal("").transform(() => null));
const cvEntry = z.object({
  title: text(200),
  org: optionalText(200),
  period: optionalText(60),
  url: optionalUrl,
  detail: optionalText(1000),
});
export const profileAccents = ["yellow", "blue", "teal", "red", "violet", "orange", "pink", "lime"] as const;
export const profileTemplates = ["classic", "minimal", "spotlight", "cards"] as const;
export const profileDisplays = ["template", "portfolio", "redirect"] as const;
export const profileInput = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(60)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes, e.g. gia-bao-huynh"),
  headline: optionalText(160),
  bio: optionalText(2000),
  photoUrl: optionalUrl,
  portfolioUrl: optionalUrl,
  links: z.array(z.object({ label: text(40), url: httpUrl })).max(8).default([]),
  interests: z.array(text(60)).max(12).default([]),
  cv: z
    .object({
      education: z.array(cvEntry).max(15).default([]),
      experience: z.array(cvEntry).max(20).default([]),
      projects: z.array(cvEntry).max(20).default([]),
      awards: z.array(cvEntry).max(20).default([]),
    })
    .default({ education: [], experience: [], projects: [], awards: [] }),
  display: z.enum(profileDisplays).default("template"),
  template: z.enum(profileTemplates).default("classic"),
  accent: z.enum(profileAccents).default("yellow"),
  published: z.boolean().default(false),
});

/** Lab news only the admin posts, then the kinds of article every member may write. */
export const labNewsKinds = ["news", "award", "paper", "event"] as const;
export const articleKinds = ["protocol", "paper_review", "incident", "article"] as const;
/** Tutorials are written by admins only and listed on /tutorials, not on the blog. */
export const TUTORIAL = "tutorial" as const;
export const newsKinds = [...labNewsKinds, ...articleKinds, TUTORIAL] as const;
export const newsStatuses = ["draft", "submitted", "published", "rejected"] as const;

/** An image uploaded to the site (`/api/v1/images/<key>`) or any https image. */
const imageRef = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => /^\/api\/v1\/images\/[a-z0-9-]+$/i.test(v) || /^https:\/\/[^\s]+$/i.test(v), "Use an uploaded image or an https:// image link")
  .optional()
  .nullable()
  .or(z.literal("").transform(() => null));

/**
 * A post on the blog. Members always save drafts and submit them for review; `status` and
 * `publishedOn` are only honoured for admins (who may publish directly or schedule a date).
 */
export const newsInput = z.object({
  kind: z.enum(newsKinds).default("article"),
  title: text(200),
  summary: text(400),
  body: optionalText(40000),
  link: optionalUrl,
  cover: imageRef,
  sources: optionalText(4000),
  publishedOn: isoDate.optional(),
  status: z.enum(["draft", "published"]).optional(),
});

export const newsReviewInput = z.object({
  decision: z.enum(["approve", "reject"]),
  note: optionalText(2000),
});

export const applicationPrograms = ["Undergraduate", "Master's", "PhD", "Other"] as const;
export const MAX_TEAM = 6;
const phoneNumber = (what: string) =>
  z
    .string()
    .trim()
    .max(20)
    .regex(/^\+?[0-9][0-9 .-]{7,18}$/, `${what}: use a phone number, e.g. 0901 234 567`);
/** Facebook profile link; `facebook.com/name` without https:// is accepted and completed. */
const facebookUrl = z.preprocess(
  (v) => (typeof v === "string" && v.trim() && !/^https?:\/\//i.test(v.trim()) ? `https://${v.trim()}` : v),
  httpUrl.refine((v) => /^https?:\/\/([a-z0-9-]+\.)*(facebook\.com|fb\.com|fb\.me)\/./i.test(v), "Facebook: use your profile link, e.g. https://facebook.com/your.name"),
);
/** One person on an application. Every field is required; the name is stored without accents. */
export const applicantInput = z.object({
  name: text(120).transform(withoutAccents),
  studentId: z
    .string()
    .trim()
    .min(4, "Student ID is too short.")
    .max(20)
    .regex(/^[A-Za-z0-9]+$/, "Student ID: letters and digits only."),
  email: z.string().trim().toLowerCase().email().max(200),
  phone: phoneNumber("Phone"),
  zalo: phoneNumber("Zalo"),
  facebook: facebookUrl,
});
/** The Join form: one application for a whole team (1 to MAX_TEAM people). */
export const applicationInput = z.object({
  members: z
    .array(applicantInput)
    .min(1)
    .max(MAX_TEAM)
    .refine((m) => new Set(m.map((x) => x.email)).size === m.length, "Each person needs their own email address."),
  program: z.enum(applicationPrograms),
  interests: z.array(z.string().trim().min(1).max(60)).max(10).default([]),
  message: z.string().trim().min(30, "Tell us a little more (at least 30 characters).").max(4000),
  link: optionalUrl,
  /** honeypot: people never fill it, bots usually do */
  website: z.string().max(200).optional(),
  /** Cloudflare Turnstile token, required once TURNSTILE_SECRET_KEY is set */
  captcha: z.string().max(4096).optional(),
});
export const applicationStatuses = ["new", "contacted", "accepted", "declined"] as const;
export const applicationUpdateInput = z.object({
  status: z.enum(applicationStatuses).optional(),
  adminNote: optionalText(2000),
});
/** A message from an admin to the applicant, emailed from the site; it may also decide the application. */
export const applicationReplyInput = z.object({
  status: z.enum(["contacted", "accepted", "declined"]).default("contacted"),
  message: z.string().trim().min(1, "Write a message.").max(4000),
  /** with `accepted`: create an account for everyone on the application and email them their login */
  createAccounts: z.boolean().default(false),
});

export const publicationKinds = ["journal", "conference", "article"] as const;
export const publicationInput = z.object({
  name: optionalText(80),
  title: text(400),
  year: z.number().int().min(1990).max(2100),
  kind: z.enum(publicationKinds),
  authors: z.array(z.string().trim().min(1).max(120)).min(1).max(60),
  venue: optionalText(300),
  doi: optionalText(200).transform((v) => (v ? v.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "") : v)),
  url: optionalUrl,
  areas: z.array(z.string().trim().min(1).max(60)).max(10).optional(),
});

/** A wall someone has just looked at: a group id, or "lab" for meetings and announcements. */
export const wallSeenInput = z.object({ scope: z.union([z.literal("lab"), z.string().uuid()]) });
