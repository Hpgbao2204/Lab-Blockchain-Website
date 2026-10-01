import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProfileView } from "@/components/people/profile-view";
import { getDb } from "@/server/db";
import { getPublicPerson } from "@/server/services/people";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const person = await getPublicPerson(await getDb(), (await params).slug);
  if (!person) return { title: "Not found" };
  return { title: person.name, description: person.headline ? `${person.name}, ${person.headline} at Blockchainist (UIT – VNU-HCM).` : `${person.name} at Blockchainist.` };
}

export default async function PersonPage({ params }: Props) {
  const person = await getPublicPerson(await getDb(), (await params).slug);
  if (!person) notFound();
  return (
    <div className="wrap page grid gap-8">
      <Link href="/people" className="mono inline-flex w-fit items-center gap-1.5 text-sm">
        <ArrowLeft size={15} aria-hidden /> All people
      </Link>
      <ProfileView person={person} />
    </div>
  );
}
