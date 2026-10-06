import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PostEditor } from "@/components/app/post-editor";
import { PageHead } from "@/components/site/page-head";
import { getDb } from "@/server/db";
import { requirePageUser } from "@/server/auth/current";
import { AppError } from "@/server/errors";
import { getPostById } from "@/server/services/news";

export const metadata: Metadata = { title: "Edit post" };

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser();
  const admin = user.role === "admin";
  const post = await getPostById(await getDb(), user, (await params).id).catch((e) => {
    if (e instanceof AppError && e.code === "not_found") return null;
    throw e;
  });
  // others' live posts are public, but only their author and admins edit them
  if (!post || (!admin && post.authorId !== user.id)) notFound();
  const mine = post.authorId === user.id;

  return (
    <div className="wrap page grid max-w-4xl gap-6">
      <Link href={admin ? "/admin/posts" : "/app/posts"} className="mono inline-flex w-fit items-center gap-1.5 text-sm">
        <ArrowLeft size={15} aria-hidden /> {admin ? "All posts" : "My posts"}
      </Link>
      <PageHead eyebrow={mine ? "Your post" : `Post by ${post.author?.name ?? "a former member"}`} title={<>Edit <span className="hl">post</span></>} />
      <PostEditor
        admin={admin}
        initial={{
          id: post.id,
          slug: post.slug,
          kind: post.kind,
          title: post.title,
          summary: post.summary,
          body: post.body ?? "",
          sources: post.sources ?? "",
          cover: post.cover ?? "",
          link: post.link ?? "",
          publishedOn: post.publishedOn,
          status: post.status,
          reviewNote: post.reviewNote,
        }}
      />
    </div>
  );
}
