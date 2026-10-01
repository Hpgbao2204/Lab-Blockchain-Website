CREATE TYPE "public"."profile_display" AS ENUM('template', 'portfolio');--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"headline" text,
	"bio" text,
	"photo_url" text,
	"portfolio_url" text,
	"links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"interests" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cv" jsonb DEFAULT '{"education":[],"experience":[],"projects":[],"awards":[]}'::jsonb NOT NULL,
	"display" "profile_display" DEFAULT 'template' NOT NULL,
	"template" text DEFAULT 'classic' NOT NULL,
	"accent" text DEFAULT 'yellow' NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;