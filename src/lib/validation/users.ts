import { z } from "zod";
import type { User } from "@/types/content";

const email = z.string().trim().email().min(1).max(320);

const userRoleSchema = z.enum(["owner", "admin", "member"]);

const userStatusSchema = z.enum(["active", "inactive", "pending"]);
const memberIdSchema = z.string().trim().min(1).max(128);
const memberProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160),
    role: z.string().trim().min(1).max(160)
  })
  .strict();

export function isUserRole(value: string): value is User["role"] {
  return userRoleSchema.safeParse(value).success;
}

export function isUserStatus(value: string): value is User["status"] {
  return userStatusSchema.safeParse(value).success;
}

export const userRecordSchema = z
  .object({
    uid: z.string().trim().min(1).max(128),
    email: email,
    role: userRoleSchema,
    status: userStatusSchema,
    memberId: z.string().trim().min(1).max(128).optional().nullable()
  })
  .strict();

const provisionUserSchema = z
  .object({
    email,
    memberId: memberIdSchema.optional(),
    member: memberProfileSchema.optional()
  })
  .strict()
  .superRefine((value, context) => {
    if (Boolean(value.memberId) === Boolean(value.member)) {
      context.addIssue({
        code: "custom",
        message: "Provide either an existing memberId or a new member profile"
      });
    }
  });

const managedUserUpdateSchema = z
  .object({
    status: z.enum(["active", "inactive"]).optional(),
    memberId: memberIdSchema.nullable().optional(),
    sendReset: z.boolean().optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one update");

const optionalPortalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .nullable()
    .optional()
    .transform((value) => (typeof value === "string" && value ? value : value === null ? null : undefined));
const optionalPortalUrl = z
  .string()
  .trim()
  .url()
  .max(2_000)
  .refine((value) => /^https?:\/\//i.test(value), "Only HTTP(S) URLs are allowed")
  .nullable()
  .optional()
  .transform((value) => (typeof value === "string" && value ? value : value === null ? null : undefined));
const orcidUrl = /^https:\/\/orcid\.org\/\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

export function isValidOrcidUrl(value: unknown): value is string {
  return typeof value === "string" && orcidUrl.test(value);
}

const optionalOrcidUrl = optionalPortalUrl.refine(
  (value) => value === undefined || value === null || isValidOrcidUrl(value),
  "ORCID must use https://orcid.org/0000-0000-0000-0000",
);
const portalStringList = (maxItems: number, maxLength: number) =>
  z.array(z.string().trim().min(1).max(maxLength)).max(maxItems).optional();
const contentIdList = z
  .array(z.string().trim().min(1).max(128).refine((value) => !value.includes("/")))
  .max(100)
  .refine((values) => new Set(values).size === values.length, "Duplicate content references are not allowed")
  .optional();
const portalProfileUpdateSchema = z
  .object({
    avatarUrl: optionalPortalUrl,
    bio: optionalPortalText(4_000),
    links: z
      .object({
        googleScholar: optionalPortalUrl,
        orcid: optionalOrcidUrl,
        webOfScience: optionalPortalUrl,
        scopus: optionalPortalUrl,
        website: optionalPortalUrl,
        github: optionalPortalUrl
      })
      .strict()
      .optional(),
    researchInterests: portalStringList(20, 160),
    education: portalStringList(20, 240),
    achievements: portalStringList(30, 320),
    cvUrl: optionalPortalUrl,
    publicationIds: contentIdList,
    projectIds: contentIdList,
    isPublic: z.boolean().optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one profile update");

export function parseUserRecord(input: unknown): Pick<User, "uid" | "email" | "role" | "status" | "memberId"> {
  const result = userRecordSchema.safeParse(input);
  if (!result.success) {
    throw new Error("Invalid user record");
  }
  return result.data;
}

export function parseUserProvision(input: unknown) {
  const result = provisionUserSchema.safeParse(input);
  if (!result.success) {
    throw new Error("Invalid account provision input");
  }
  return result.data;
}

export function parseManagedUserUpdate(input: unknown) {
  const result = managedUserUpdateSchema.safeParse(input);
  if (!result.success) {
    throw new Error("Invalid account update input");
  }
  return result.data;
}

export function parsePortalProfileUpdate(input: unknown) {
  const result = portalProfileUpdateSchema.safeParse(input);
  if (!result.success) {
    throw new Error("Invalid profile update input");
  }
  return result.data;
}
