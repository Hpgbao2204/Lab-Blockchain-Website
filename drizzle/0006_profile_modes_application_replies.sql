ALTER TYPE "public"."profile_display" ADD VALUE 'redirect';--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "facebook" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "zalo" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "replies" jsonb DEFAULT '[]'::jsonb NOT NULL;