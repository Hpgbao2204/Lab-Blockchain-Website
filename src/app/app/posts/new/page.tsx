import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PostEditor } from "@/components/app/post-editor";
import { PageHead } from "@/components/site/page-head";
import { requirePageUser } from "@/server/auth/current";
import { labToday } from "@/lib/weeks";

export const metadata: Metadata = { title: "Write a post" };

export default async function NewPostPage() {
  const user = await requirePageUser();
  const admin = user.role === "admin";
  return (
    <div className="wrap page grid max-w-4xl gap-6">
      <Link href={admin ? "/admin/posts" : "/app/posts"} className="mono inline-flex w-fit items-center gap-1.5 text-sm">
        <ArrowLeft size={15} aria-hidden /> {admin ? "All posts" : "My posts"}
      </Link>
      <PageHead eyebrow="New post" title={<>Write a <span className="hl">post</span></>}>
        {admin ? "As an admin you can publish directly." : "It stays a draft until you submit it for review."}
      </PageHead>
      <PostEditor admin={admin} initial={{ kind: admin ? "news" : "paper_review", title: "", summary: "", body: "", sources: "", cover: "", link: "", publishedOn: labToday(), status: "draft" }} />
    </div>
  );
}
