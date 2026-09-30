import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { BackToTop } from "@/components/ui/back-to-top";
import { getSiteSettings } from "@/lib/data/public-content";

export default async function PublicSiteLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col pt-[73px]">{children}</main>
      <SiteFooter settings={settings} />
      <BackToTop />
    </div>
  );
}
