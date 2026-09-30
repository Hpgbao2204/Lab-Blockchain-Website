"use client";

import Image from "next/image";
import { BookOpen, ExternalLink, Mail, MapPin } from "lucide-react";
import type { SiteSettings } from "@/types/content";
import { useTranslation } from "@/components/i18n/locale-provider";

type SiteFooterProps = {
  settings?: Pick<SiteSettings, "contactEmail" | "orcidId" | "googleScholarUrl">;
};

const fallbackSettings = {
  contactEmail: "contact@blockchainist.id.vn",
  orcidId: "0000-0003-1156-7072",
  googleScholarUrl: undefined
};

export function SiteFooter({ settings }: SiteFooterProps) {
  const { t } = useTranslation();
  const contactEmail = settings?.contactEmail ?? fallbackSettings.contactEmail;
  const orcidId = settings?.orcidId ?? fallbackSettings.orcidId;
  const googleScholarUrl = settings?.googleScholarUrl ?? fallbackSettings.googleScholarUrl;

  return (
    <footer className="border-t border-border bg-secondary text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="inline-flex rounded-full bg-white px-3 py-2 shadow-sm">
            <Image
              src="/logo.png"
              alt="Blockchainist Research Team"
              width={168}
              height={40}
              style={{ width: "auto", height: "auto" }}
            />
          </div>
          <p className="mt-5 max-w-md text-sm leading-6 text-white/68">
            {t("footerDescription")}
          </p>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{t("footerAcademicLinks")}</h2>
          <div className="mt-4 grid gap-3 text-sm text-white/68">
            <a href={`mailto:${contactEmail}`} className="inline-flex items-center gap-2 hover:text-white">
              <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
              {contactEmail}
            </a>
            <a
              href={`https://orcid.org/${orcidId}`}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 hover:text-white"
            >
              <ExternalLink className="h-4 w-4 text-primary" aria-hidden="true" />
              ORCID
            </a>
            {googleScholarUrl ? (
              <a
                href={googleScholarUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 hover:text-white"
              >
                <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
                Google Scholar
              </a>
            ) : null}
            <p className="inline-flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
              {t("footerAddress")}
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-5 text-center text-xs text-white/45">
        © {new Date().getFullYear()} Blockchainist Research Team. {t("footerRights")}
      </div>
    </footer>
  );
}
