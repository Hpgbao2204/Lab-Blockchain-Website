CREATE TABLE "wall_reads" (
	"user_id" uuid NOT NULL,
	"scope" text NOT NULL,
	"seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wall_reads_user_id_scope_pk" PRIMARY KEY("user_id","scope")
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "wall_reads" ADD CONSTRAINT "wall_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;