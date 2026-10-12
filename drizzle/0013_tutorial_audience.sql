CREATE TYPE "public"."news_audience" AS ENUM('public', 'members', 'selected');--> statement-breakpoint
CREATE TABLE "news_readers" (
	"news_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "news_readers_news_id_user_id_pk" PRIMARY KEY("news_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN "audience" "news_audience" DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE "news_readers" ADD CONSTRAINT "news_readers_news_id_news_id_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_readers" ADD CONSTRAINT "news_readers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "news_readers_user_idx" ON "news_readers" USING btree ("user_id");