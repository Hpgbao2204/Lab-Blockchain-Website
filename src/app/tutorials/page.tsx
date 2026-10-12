import type { Metadata } from "next";
import Link from "next/link";
import { Lock, PenLine } from "lucide-react";
import { PageHead } from "@/components/site/page-head";
import { Reveal } from "@/components/site/reveal";
import { NewsCard } from "@/components/news/news-card";
import { getDb } from "@/server/db";
import { getCurrentUser } from "@/server/auth/current";
import { hasPrivateTutorials, listNews } from "@/server/services/news";

export const metadata: Metadata = {
  title: "Tutorials",
  description: "Step-by-step tutorials on blockchain research and engineering, written by the Blockchainist lab's principal investigator.",
};
export const dynamic = "force-dynamic";

/**
 * Tutorials written by the lab's admins (members write on the blog instead). Each reader sees the
 * ones they may read; admins also see drafts and get the button to write one.
 */
export default async function TutorialsPage() {
  const user = await getCurrentUser().catch(() => null);
  const admin = user?.role === "admin";
  const db = await getDb();
  const [items, hidden] = await Promise.all([listNews(db, user, { kind: "tutorial", all: admin }), user ? false : hasPrivateTutorials(db)]);

  return (
    <div className="wrap page">
      <PageHead eyebrow="Tutorials" title={<>Learn it <span className="hl">step by step</span></>}>
        Guides from the lab&apos;s principal investigator: the tools, protocols and research methods our members start with.
      </PageHead>
      {admin && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Link href="/tutorials/new" className="btn btn-yellow">
            <PenLine size={17} aria-hidden /> Write a tutorial
          </Link>
        </div>
      )}
      {hidden && (
        <p className="mb-8 flex items-center gap-2 text-sm text-ink-2">
          <Lock size={15} aria-hidden /> Some tutorials are for lab members.{" "}
          <Link href="/login?next=/tutorials" className="font-bold underline underline-offset-4">
            Sign in
          </Link>{" "}
          to see them.
        </p>
      )}
      {items.length ? (
        <ul className="feed list-none p-0">
          {items.map((n, i) => (
            <Reveal as="li" key={n.id} delay={Math.min(i, 6) * 50}>
              <NewsCard item={n} />
            </Reveal>
          ))}
        </ul>
      ) : (
        <p className="note">
          <b>Soon</b>
          <span>The first tutorials are being written.</span>
        </p>
      )}
    </div>
  );
}
