-- An early preview build of the blog-posts branch dropped "news"."published" from the shared
-- production database before that migration was withdrawn. The column is unused but still in the
-- schema, so every insert into "news" failed there. Re-add it where it is missing.
ALTER TABLE "news" ADD COLUMN IF NOT EXISTS "published" boolean DEFAULT true NOT NULL;
