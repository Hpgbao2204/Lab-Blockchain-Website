import { ExternalLink, Mail, MapPin } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";
import { PageHero } from "@/components/site/page-hero";
import { Card } from "@/components/ui/card";
import { getSiteSettings } from "@/lib/data/public-content";
import { getRequestLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/i18n";

export const metadata = {
  title: "Contact",
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const [settings, locale] = await Promise.all([
    getSiteSettings(),
    getRequestLocale(),
  ]);
  const contactInfo = [
    {
      icon: Mail,
      label: translate(locale, "contactEmail"),
      value: settings.contactEmail,
      href: `mailto:${settings.contactEmail}`,
    },
    {
      icon: ExternalLink,
      label: "ORCID",
      value: settings.orcidId,
      href: `https://orcid.org/${settings.orcidId}`,
    },
    {
      icon: MapPin,
      label: translate(locale, "contactAddress"),
      value: translate(locale, "contactAddressValue"),
    },
  ];

  return (
    <>
      <PageHero
        eyebrow={translate(locale, "contactEyebrow")}
        title={translate(locale, "contactTitle")}
        highlight={translate(locale, "contactHighlight")}
        description={translate(locale, "contactDescription")}
      />

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-14 lg:grid-cols-[360px_1fr]">
        <div className="grid content-start gap-3">
          {contactInfo.map(({ icon: Icon, label, value, href }) => {
            const content = (
              <div className="group flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm transition-colors duration-300 hover:border-primary/25">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/15 bg-primary-soft/60 text-primary transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted">
                    {label}
                  </span>
                  <span className="text-sm text-foreground">{value}</span>
                </span>
              </div>
            );

            return href ? (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                className="block"
              >
                {content}
              </a>
            ) : (
              <div key={label}>{content}</div>
            );
          })}
        </div>

        <Card className="p-6 md:p-8">
          <ContactForm />
        </Card>
      </section>
    </>
  );
}
