-- pg_trgm: fuzzy venue search (available on Neon and Supabase; PGlite loads it in src/server/db/client.ts)
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE TYPE "public"."venue_kind" AS ENUM('conference', 'journal');--> statement-breakpoint
CREATE TABLE "venues" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" "venue_kind" NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"acronym" text,
	"issn" text,
	"eissn" text,
	"publisher" text,
	"country" text,
	"rank" text,
	"ccf" text,
	"quartile" text,
	"rank_score" integer DEFAULT 0 NOT NULL,
	"impact" real,
	"h_index" real,
	"top_tier" boolean DEFAULT false NOT NULL,
	"flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"areas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"topics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"search" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"import_run" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "venues_kind_slug" UNIQUE("kind","slug")
);
--> statement-breakpoint
CREATE INDEX "venues_kind_rank_idx" ON "venues" USING btree ("kind","rank_score");--> statement-breakpoint
CREATE INDEX "venues_search_trgm_idx" ON "venues" USING gin ("search" gin_trgm_ops);