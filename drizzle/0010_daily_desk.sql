CREATE TABLE "desk_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day" date NOT NULL,
	"trigger" text DEFAULT 'cron' NOT NULL,
	"kind" text,
	"topic" text,
	"post_id" uuid,
	"report" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feed_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"published_at" timestamp with time zone,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"post_id" uuid,
	CONSTRAINT "feed_items_url_unique" UNIQUE("url")
);
--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN "ai_assisted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN "ai_check" text;--> statement-breakpoint
ALTER TABLE "desk_runs" ADD CONSTRAINT "desk_runs_post_id_news_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."news"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_items" ADD CONSTRAINT "feed_items_post_id_news_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."news"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "desk_runs_day_idx" ON "desk_runs" USING btree ("day");--> statement-breakpoint
CREATE INDEX "feed_items_fetched_idx" ON "feed_items" USING btree ("fetched_at");--> statement-breakpoint
CREATE INDEX "feed_items_source_idx" ON "feed_items" USING btree ("source");