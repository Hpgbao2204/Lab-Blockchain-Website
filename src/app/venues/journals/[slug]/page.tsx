import { notFound } from "next/navigation";
import { VenueDetail, venueMetadata } from "@/components/venues/venue-detail";
import { getDb } from "@/server/db";
import { getVenue, similarVenues } from "@/server/services/venues";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const v = await getVenue(await getDb(), "journal", (await params).slug);
  return v ? venueMetadata(v) : {};
}

export default async function Page({ params }: Props) {
  const db = await getDb();
  const v = await getVenue(db, "journal", (await params).slug);
  if (!v) notFound();
  return <VenueDetail v={v} similar={await similarVenues(db, v)} />;
}
