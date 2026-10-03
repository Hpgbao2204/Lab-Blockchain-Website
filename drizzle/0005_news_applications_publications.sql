CREATE TYPE "public"."application_status" AS ENUM('new', 'contacted', 'accepted', 'declined');--> statement-breakpoint
CREATE TYPE "public"."news_kind" AS ENUM('news', 'award', 'paper', 'event');--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"program" text NOT NULL,
	"student_id" text,
	"interests" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"message" text NOT NULL,
	"link" text,
	"status" "application_status" DEFAULT 'new' NOT NULL,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hidden_publications" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"kind" "news_kind" DEFAULT 'news' NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"body" text,
	"link" text,
	"published_on" date NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"author_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "news_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "publication_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"title" text NOT NULL,
	"year" integer NOT NULL,
	"kind" text NOT NULL,
	"authors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"venue" text,
	"doi" text,
	"url" text,
	"areas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "news" ADD CONSTRAINT "news_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_entries" ADD CONSTRAINT "publication_entries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "applications_created_idx" ON "applications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "news_published_idx" ON "news" USING btree ("published_on");