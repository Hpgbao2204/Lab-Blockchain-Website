CREATE TYPE "public"."news_status" AS ENUM('draft', 'submitted', 'published', 'rejected');--> statement-breakpoint
ALTER TYPE "public"."news_kind" ADD VALUE 'protocol';--> statement-breakpoint
ALTER TYPE "public"."news_kind" ADD VALUE 'paper_review';--> statement-breakpoint
ALTER TYPE "public"."news_kind" ADD VALUE 'incident';--> statement-breakpoint
ALTER TYPE "public"."news_kind" ADD VALUE 'article';--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN "cover" text;--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN "sources" text;--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN "status" "news_status" DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN "review_note" text;--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN "reviewed_by" uuid;--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN "submitted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "news" ADD CONSTRAINT "news_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "news_status_idx" ON "news" USING btree ("status");--> statement-breakpoint
CREATE INDEX "news_author_idx" ON "news" USING btree ("author_id");--> statement-breakpoint
UPDATE "news" SET "status" = 'draft' WHERE "published" = false;