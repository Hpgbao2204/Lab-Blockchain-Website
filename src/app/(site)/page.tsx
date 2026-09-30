import { HomeLanding } from "@/components/landing/home-landing";
import {
  getPublicMembers,
  getPublicPublications,
  getSiteSettings
} from "@/lib/data/public-content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, publications, members] = await Promise.all([
    getSiteSettings(),
    getPublicPublications(),
    getPublicMembers()
  ]);

  return (
    <HomeLanding
      settings={settings}
      publications={publications}
      members={members}
    />
  );
}
