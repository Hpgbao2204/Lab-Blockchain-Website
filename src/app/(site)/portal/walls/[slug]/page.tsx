import { WallsWorkspace } from "@/components/portal/walls-workspace";

export const metadata = { title: "Wall", robots: { index: false, follow: false } };

export default async function WallPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <WallsWorkspace slug={slug} />;
}
