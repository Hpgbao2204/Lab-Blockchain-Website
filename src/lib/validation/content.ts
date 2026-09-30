import { z } from "zod";

export const adminContentCollections = ["members", "publications", "projects"] as const;
export type AdminContentCollection = (typeof adminContentCollections)[number];

const url = z.string().trim().url();
const shortText = z.string().trim().min(1).max(160);
const longText = z.string().trim().min(1).max(8_000);
const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .transform((value) => value || undefined);
const stringList = (maxItems: number, maxLength: number) =>
  z.array(z.string().trim().min(1).max(maxLength)).max(maxItems);
const slug = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160);

const memberSchema = z
  .object({
    name: shortText,
    slug,
    role: shortText,
    avatarUrl: url.optional(),
    bio: optionalText(4_000),
    links: z
      .object({
        googleScholar: url.optional(),
        orcid: url.optional(),
        webOfScience: url.optional(),
        scopus: url.optional(),
        website: url.optional(),
        github: url.optional()
      })
      .strict()
      .optional(),
    aliases: stringList(20, 200).optional(),
    researchInterests: stringList(20, 160).optional(),
    education: stringList(20, 240).optional(),
    achievements: stringList(30, 320).optional(),
    order: z.number().int().min(0).max(10_000).optional(),
    isActive: z.boolean().optional(),
    isPublic: z.boolean().optional()
  })
  .strict();

const publicationSchema = z
  .object({
    title: longText,
    authors: stringList(50, 200),
    year: z.number().int().min(1900).max(2100).optional(),
    venue: optionalText(500),
    type: optionalText(160),
    doi: z.string().trim().max(512).optional(),
    url: url.optional(),
    abstract: optionalText(12_000),
    imageUrl: url.optional(),
    isFeatured: z.boolean().optional(),
    isPublished: z.boolean().optional()
  })
  .strict();

const projectSchema = z
  .object({
    title: longText,
    slug,
    description: optionalText(8_000),
    status: z.enum(["ongoing", "completed", "open"]).optional(),
    leader: optionalText(160),
    members: stringList(50, 160).optional(),
    memberIds: stringList(50, 160).optional(),
    tags: stringList(30, 100).optional(),
    funding: optionalText(500),
    level: optionalText(160),
    type: optionalText(160),
    startYear: z.number().int().min(1900).max(2100).optional(),
    endYear: z.number().int().min(1900).max(2100).optional(),
    budget: z.number().min(0).max(1_000_000_000_000).optional(),
    fundingAgency: optionalText(500),
    abstract: optionalText(8_000),
    objectives: optionalText(8_000),
    results: optionalText(8_000),
    url: url.optional(),
    doi: z.string().trim().max(512).optional(),
    imageUrl: url.optional(),
    isFeatured: z.boolean().optional()
  })
  .strict();

const schemas = {
  members: memberSchema,
  publications: publicationSchema,
  projects: projectSchema
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isAdminContentCollection(value: string): value is AdminContentCollection {
  return adminContentCollections.includes(value as AdminContentCollection);
}

export function parseAdminContentInput(
  collection: AdminContentCollection,
  input: unknown,
  isUpdate = false
): Record<string, unknown> {
  if (!isRecord(input) || (isUpdate && Object.keys(input).length === 0)) {
    throw new Error(`Invalid ${collection} input`);
  }

  const schema = isUpdate ? schemas[collection].partial() : schemas[collection];
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new Error(`Invalid ${collection} input`);
  }

  return result.data;
}

const applicationStatusSchema = z.object({
  status: z.enum(["pending", "contacted", "archived"])
}).strict();

export function parseApplicationStatusUpdate(input: unknown): { status: "pending" | "contacted" | "archived" } {
  const result = applicationStatusSchema.safeParse(input);
  if (!result.success) {
    throw new Error("Invalid application status update");
  }

  return result.data;
}

const principalInvestigatorSchema = z
  .object({
    name: shortText,
    title: shortText,
    bio: longText,
    avatarUrl: url.optional(),
    researchInterests: stringList(20, 160)
  })
  .strict();

const settingsSchema = z
  .object({
    siteName: shortText.optional(),
    tagline: optionalText(320),
    contactEmail: z.string().trim().email().max(320).optional(),
    orcidId: z.string().trim().regex(/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/).optional(),
    googleScholarUrl: url.optional(),
    principalInvestigator: principalInvestigatorSchema.partial().strict().optional(),
    featureFlags: z.object({ orcidSyncEnabled: z.boolean().optional() }).strict().optional()
  })
  .strict();

export function parseSettingsUpdate(input: unknown): Record<string, unknown> {
  if (!isRecord(input) || Object.keys(input).length === 0) {
    throw new Error("Invalid settings update");
  }

  const result = settingsSchema.safeParse(input);
  if (!result.success) {
    throw new Error("Invalid settings update");
  }

  return result.data;
}
