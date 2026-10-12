import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PostEditor } from "@/components/app/post-editor";
import { PageHead } from "@/components/site/page-head";
import { requirePageUser } from "@/server/auth/current";
import { getDb } from "@/server/db";
import { listUsers } from "@/server/services/users";
import { labToday } from "@/lib/weeks";

export const metadata: Metadata = { title: "Write a tutorial", robots: { index: false } };

/** Admins write a tutorial right from the Tutorials page. */
export default async function NewTutorialPage() {
  const user = await requirePageUser({ admin: true });
  const people = (await listUsers(await getDb(), user)).filter((u) => u.active).map((u) => ({ id: u.id, name: u.name }));
  return (
    <div className="wrap page grid max-w-4xl gap-6">
      <Link href="/tutorials" className="mono inline-flex w-fit items-center gap-1.5 text-sm">
        <ArrowLeft size={15} aria-hidden /> All tutorials
      </Link>
      <PageHead eyebrow="New tutorial" title={<>Write a <span className="hl">tutorial</span></>}>
        It goes on the Tutorials page when you publish. Choose who can read it below.
      </PageHead>
      <PostEditor
        admin
        people={people}
        initial={{ kind: "tutorial", title: "", summary: "", body: "", sources: "", cover: "", link: "", publishedOn: labToday(), status: "draft", audience: "public", readerIds: [] }}
      />
    </div>
  );
}
