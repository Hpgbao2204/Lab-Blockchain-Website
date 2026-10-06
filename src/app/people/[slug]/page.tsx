import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PortfolioFrame } from "@/components/people/portfolio-frame";
import { ProfileView } from "@/components/people/profile-view";
import { getDb } from "@/server/db";
import { siteUrl } from "@/server/jobs/weekly-digest";
import { getPublicPerson } from "@/server/services/people";
import { canEmbed } from "@/server/services/portfolio-frame";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const person = await getPublicPerson(await getDb(), (await params).slug);
  if (!person) return { title: "Not found" };
  return { title: person.name, description: person.headline ? `${person.name}, ${person.headline} at Blockchainist (UIT – VNU-HCM).` : `${person.name} at Blockchainist.` };
}

/**
 * A member's page, as they chose in their profile: the CV built here, their own website shown
 * inside the lab's frame, or a redirect to that website (also used when it refuses framing).
 */
export default async function PersonPage({ params }: Props) {
  const person = await getPublicPerson(await getDb(), (await params).slug);
  if (!person) notFound();
  if (person.portfolioUrl && person.display !== "template") {
    if (person.display === "redirect" || !(await canEmbed(person.portfolioUrl, siteUrl()))) redirect(person.portfolioUrl);
    return <PortfolioFrame person={person} />;
  }
  return (
    <div className="wrap page grid gap-8">
      <Link href="/team" className="mono inline-flex w-fit items-center gap-1.5 text-sm">
        <ArrowLeft size={15} aria-hidden /> The team
      </Link>
      <ProfileView person={person} />
    </div>
  );
}
