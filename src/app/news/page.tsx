import type { Metadata } from "next";
import { PageHead } from "@/components/site/page-head";
import { Reveal } from "@/components/site/reveal";
import { NewsCard } from "@/components/news/news-card";
import { getDb } from "@/server/db";
import { listNews } from "@/server/services/news";

export const metadata: Metadata = { title: "News", description: "News, awards and accepted papers from the Blockchainist group." };
export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const items = await listNews(await getDb(), null);
  return (
    <div className="wrap page">
      <PageHead eyebrow="News" title={<>What&apos;s <span className="hl">new</span></>}>
        Accepted papers, awards, events and other news from the lab.
      </PageHead>
      {items.length ? (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((n, i) => (
            <Reveal as="li" key={n.id} delay={Math.min(i, 6) * 50}>
              <NewsCard item={n} />
            </Reveal>
          ))}
        </ul>
      ) : (
        <p className="note">
          <b>Soon</b>
          <span>No news yet. Check back after the next paper deadline.</span>
        </p>
      )}
    </div>
  );
}
