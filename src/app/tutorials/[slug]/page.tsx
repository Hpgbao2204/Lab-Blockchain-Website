import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { getDb } from "@/server/db";
import { getCurrentUser } from "@/server/auth/current";
import { needsSignIn } from "@/server/services/news";
import { PostArticle, loadPost, postMetadata } from "@/components/news/post-article";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await loadPost((await params).slug);
  return found ? postMetadata(found.item) : {};
}

/** A tutorial; any other post found here moves to its address on the blog. */
export default async function TutorialPage({ params }: Props) {
  const { slug } = await params;
  const found = await loadPost(slug);
  if (!found) {
    // members-only or picked readers: a visitor is asked to sign in, a member who was not picked gets a 404
    if (!(await getCurrentUser()) && (await needsSignIn(await getDb(), slug))) redirect(`/login?next=${encodeURIComponent(`/tutorials/${slug}`)}`);
    notFound();
  }
  if (found.item.kind !== "tutorial") permanentRedirect(`/news/${found.item.slug}`);
  return <PostArticle item={found.item} user={found.user} />;
}
