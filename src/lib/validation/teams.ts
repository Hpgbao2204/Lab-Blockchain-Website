import { z } from "zod";
import type { Team } from "@/types/content";

const memberId = z.string().trim().min(1).max(128);
const memberIds = z.array(memberId).min(1, "A wall needs at least one member").max(30).refine((values) => new Set(values).size === values.length, "Duplicate members are not allowed");
const slug = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160);
const optionalDescription = z.string().trim().max(4_000).optional().transform((value) => value || undefined);

const teamInputSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    slug,
    description: optionalDescription,
    memberIds,
    isActive: z.boolean().default(true)
  })
  .strict();

const teamUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(160).optional(),
    slug: slug.optional(),
    description: optionalDescription.optional(),
    memberIds: memberIds.optional(),
    isActive: z.boolean().optional()
  })
  .strict()
  .refine((team) => Object.keys(team).length > 0, "Provide at least one team update");

export function parseTeamInput(input: unknown): Omit<Team, "id" | "createdAt" | "updatedAt" | "updatedBy"> {
  const result = teamInputSchema.safeParse(input);
  if (!result.success) {
    const message = result.error.issues[0]?.message;
    throw new Error(message || "Invalid team input");
  }
  return result.data;
}

export function parseTeamUpdate(input: unknown): Partial<Omit<Team, "id" | "createdAt" | "updatedAt" | "updatedBy">> {
  const result = teamUpdateSchema.safeParse(input);
  if (!result.success) {
    const message = result.error.issues[0]?.message;
    throw new Error(message || "Invalid team update");
  }
  return result.data;
}
