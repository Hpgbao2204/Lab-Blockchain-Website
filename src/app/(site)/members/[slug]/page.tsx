import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicProfile } from "@/components/members/public-profile";
import { getPublicMemberProfile } from "@/lib/data/public-content";
import { getRequestLocale } from "@/lib/i18n-server";

type MemberProfilePageProps = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: MemberProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getPublicMemberProfile(slug);
  return { title: profile ? profile.member.name : "Member not found" };
}

export default async function MemberProfilePage({ params }: MemberProfilePageProps) {
  const { slug } = await params;
  const [profile, locale] = await Promise.all([getPublicMemberProfile(slug), getRequestLocale()]);
  if (!profile) notFound();

  return <PublicProfile {...profile} locale={locale} />;
}
