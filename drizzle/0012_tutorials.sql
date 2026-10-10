-- Tutorials (written by admins, shown on /tutorials) are posts of a new kind. IF NOT EXISTS keeps
-- this safe to re-run (preview builds migrate the shared database).
ALTER TYPE "public"."news_kind" ADD VALUE IF NOT EXISTS 'tutorial';
