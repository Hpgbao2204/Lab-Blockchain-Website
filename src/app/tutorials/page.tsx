import type { Metadata } from "next";
import { PageHead } from "@/components/site/page-head";
import { Reveal } from "@/components/site/reveal";
import { NewsCard } from "@/components/news/news-card";
import { getDb } from "@/server/db";
import { listNews } from "@/server/services/news";

export const metadata: Metadata = {
  title: "Tutorials",
  description: "Step-by-step tutorials on blockchain research and engineering, written by the Blockchainist lab's principal investigator.",
};
export const dynamic = "force-dynamic";

/** Tutorials written by the lab's admins (members write on the blog instead). */
export default async function TutorialsPage() {
  const items = await listNews(await getDb(), null, { kind: "tutorial" });

  return (
    <div className="wrap page">
      <PageHead eyebrow="Tutorials" title={<>Learn it <span className="hl">step by step</span></>}>
        Guides from the lab&apos;s principal investigator: the tools, protocols and research methods our members start with.
      </PageHead>
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
