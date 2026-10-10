import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PostEditor } from "@/components/app/post-editor";
import { PageHead } from "@/components/site/page-head";
import { requirePageUser } from "@/server/auth/current";
import { labToday } from "@/lib/weeks";

export const metadata: Metadata = { title: "Write a tutorial" };

export default async function NewTutorialPage() {
  await requirePageUser({ admin: true });
  return (
    <div className="wrap page grid max-w-4xl gap-6">
      <Link href="/admin/tutorials" className="mono inline-flex w-fit items-center gap-1.5 text-sm">
        <ArrowLeft size={15} aria-hidden /> All tutorials
      </Link>
      <PageHead eyebrow="New tutorial" title={<>Write a <span className="hl">tutorial</span></>}>
        It goes on the public Tutorials page when you publish.
      </PageHead>
      <PostEditor admin initial={{ kind: "tutorial", title: "", summary: "", body: "", sources: "", cover: "", link: "", publishedOn: labToday(), status: "draft" }} />
    </div>
  );
}
