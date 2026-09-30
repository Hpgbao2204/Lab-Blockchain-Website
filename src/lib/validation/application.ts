import { z } from "zod";
import type { ApplicationInput } from "@/types/content";

const optionalTrimmedString = z
  .string()
  .trim()
  .max(240)
  .optional()
  .transform((value) => (value ? value : undefined));

const applicationSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(320).toLowerCase(),
  school: optionalTrimmedString,
  phone: optionalTrimmedString.refine((value) => !value || value.length <= 40),
  message: z.string().trim().min(10).max(8_000)
});

const applicationSubmissionSchema = applicationSchema.extend({
  turnstileToken: z.string().trim().min(1).max(2_048)
});

export function parseApplicationInput(input: unknown): ApplicationInput {
  const result = applicationSchema.safeParse(input);

  if (!result.success) {
    throw new Error("Invalid application input");
  }

  return {
    ...result.data,
    status: "pending",
    source: "website_contact_form"
  };
}

export function parseApplicationSubmission(input: unknown): {
  application: ApplicationInput;
  turnstileToken: string;
} {
  const result = applicationSubmissionSchema.safeParse(input);
  if (!result.success) {
    throw new Error("Invalid application input");
  }

  const { turnstileToken, ...applicationInput } = result.data;
  return {
    application: parseApplicationInput(applicationInput),
    turnstileToken
  };
}
