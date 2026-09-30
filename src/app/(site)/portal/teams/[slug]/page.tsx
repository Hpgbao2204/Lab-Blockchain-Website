export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { redirect } = await import("next/navigation");
  redirect(`/portal/walls/${slug}`);
}
