import type { Metadata } from "next";
import Link from "next/link";
import { PenLine } from "lucide-react";
import { PostRow } from "@/components/app/post-row";
import { PageHead, SectionHead } from "@/components/site/page-head";
import { getDb } from "@/server/db";
import { requirePageUser } from "@/server/auth/current";
import { listMyPosts } from "@/server/services/news";
import { labToday } from "@/lib/weeks";

export const metadata: Metadata = { title: "My posts" };

export default async function MyPostsPage() {
  const user = await requirePageUser();
  const posts = await listMyPosts(await getDb(), user);
  const live = posts.filter((p) => p.status === "published").length;
  const today = labToday();

  return (
    <div className="wrap page grid grid-cols-[minmax(0,1fr)] gap-8">
      <PageHead eyebrow="Members · blog" title={<>My <span className="hl">posts</span></>}>
        Write about a paper you read, a protocol you studied or an incident you dug into. Save drafts as you go, then submit; an admin reads it and
        publishes it on the home page or sends it back with notes. Posts are in English.
      </PageHead>
      <section aria-labelledby="mine" className="grid gap-4">
        <SectionHead id="mine" no={String(posts.length).padStart(2, "0")} title={live ? `${live} published` : "Your posts"}>
          <Link href="/app/posts/new" className="btn btn-yellow btn-sm more">
            <PenLine size={15} aria-hidden /> Write a post
          </Link>
        </SectionHead>
        {posts.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {posts.map((p) => (
              <PostRow key={p.id} post={p} today={today} />
            ))}
          </div>
        ) : (
          <p className="note">
            <b>Start</b>
            <span>No posts yet. A good first one: a one-page review of the last paper you read for the lab.</span>
          </p>
        )}
      </section>
    </div>
  );
}
