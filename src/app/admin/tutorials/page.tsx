import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, PenLine } from "lucide-react";
import { PostRow } from "@/components/app/post-row";
import { PageHead, SectionHead } from "@/components/site/page-head";
import { getDb } from "@/server/db";
import { requirePageUser } from "@/server/auth/current";
import { listNews } from "@/server/services/news";
import { labToday } from "@/lib/weeks";

export const metadata: Metadata = { title: "Tutorials" };

/** Admins write the tutorials on /tutorials here; members cannot. */
export default async function TutorialsAdminPage() {
  const user = await requirePageUser({ admin: true });
  const items = await listNews(await getDb(), user, { all: true, kind: "tutorial", limit: 300 });
  const today = labToday();

  return (
    <div className="wrap page grid grid-cols-[minmax(0,1fr)] gap-8">
      <PageHead eyebrow="Admin · public site" title={<>Tutorials</>}>
        Step-by-step guides on the public Tutorials page. Only admins write them; members write on the blog under Posts. Same editor as posts: save a draft
        or publish straight away.
      </PageHead>
      <section aria-labelledby="tutorials" className="grid gap-4">
        <SectionHead id="tutorials" no={String(items.length).padStart(2, "0")} title="All tutorials">
          <span className="more flex flex-wrap gap-2">
            <Link href="/tutorials" className="btn btn-sm">
              Public page <ArrowUpRight size={15} aria-hidden />
            </Link>
            <Link href="/admin/tutorials/new" className="btn btn-yellow btn-sm">
              <PenLine size={15} aria-hidden /> Write a tutorial
            </Link>
          </span>
        </SectionHead>
        {items.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {items.map((p) => (
              <PostRow key={p.id} post={p} showAuthor today={today} />
            ))}
          </div>
        ) : (
          <p className="note">
            <b>Empty</b>
            <span>No tutorials yet.</span>
          </p>
        )}
      </section>
    </div>
  );
}
