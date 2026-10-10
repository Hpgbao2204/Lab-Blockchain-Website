import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PostEditor } from "@/components/app/post-editor";
import { PageHead } from "@/components/site/page-head";
import { getDb } from "@/server/db";
import { requirePageUser } from "@/server/auth/current";
import { AppError } from "@/server/errors";
import { getPostById } from "@/server/services/news";

export const metadata: Metadata = { title: "Edit tutorial" };

export default async function EditTutorialPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser({ admin: true });
  const post = await getPostById(await getDb(), user, (await params).id).catch((e) => {
    if (e instanceof AppError && e.code === "not_found") return null;
    throw e;
  });
  if (!post) notFound();
  if (post.kind !== "tutorial") redirect(`/app/posts/${post.id}`);

  return (
    <div className="wrap page grid max-w-4xl gap-6">
      <Link href="/admin/tutorials" className="mono inline-flex w-fit items-center gap-1.5 text-sm">
        <ArrowLeft size={15} aria-hidden /> All tutorials
      </Link>
      <PageHead eyebrow="Tutorial" title={<>Edit <span className="hl">tutorial</span></>} />
      <PostEditor
        admin
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
