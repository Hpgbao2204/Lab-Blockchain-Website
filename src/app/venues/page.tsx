import { VenuesPage, venuesMetadata, type VenueSearchParams } from "@/components/venues/venues-page";

export const dynamic = "force-dynamic";

type Props = { searchParams: VenueSearchParams };

export const generateMetadata = ({ searchParams }: Props) => venuesMetadata(searchParams);

export default function Page({ searchParams }: Props) {
  return <VenuesPage searchParams={searchParams} />;
}
