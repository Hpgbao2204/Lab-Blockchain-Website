import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { PostArticle, loadPost, postMetadata } from "@/components/news/post-article";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await loadPost((await params).slug);
  return found ? postMetadata(found.item) : {};
}

/** A tutorial; any other post found here moves to its address on the blog. */
export default async function TutorialPage({ params }: Props) {
  const found = await loadPost((await params).slug);
  if (!found) notFound();
  if (found.item.kind !== "tutorial") permanentRedirect(`/news/${found.item.slug}`);
  return <PostArticle item={found.item} user={found.user} />;
}
