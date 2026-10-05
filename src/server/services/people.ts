import type { Db } from "../db/client";
import type { CvSections } from "../db/schema";
import { listPeople } from "@/lib/content";
import { getPublishedProfile, listPublishedProfiles, profilePhoto, type PublicProfile } from "./profiles";

export interface PersonView {
  slug: string;
  name: string;
  role: "pi" | "member";
  headline: string | null;
  bio: string | null;
  photo: string | null;
  interests: string[];
  links: { label: string; url: string }[];
  portfolioUrl: string | null;
  display: "template" | "portfolio" | "redirect";
  template: string;
  accent: string;
  cv: CvSections;
  areas: string[];
  /** placeholder people shown only until real profiles exist */
  sample: boolean;
  /** has its own page at /people/[slug] */
  hasPage: boolean;
}

const EMPTY_CV: CvSections = { education: [], experience: [], projects: [], awards: [] };

const fromProfile = (p: PublicProfile, role: PersonView["role"] = "member"): PersonView => ({
  slug: p.slug,
  name: p.name,
  role,
  headline: p.headline,
  bio: p.bio,
  photo: profilePhoto(p),
  interests: p.interests,
  links: p.links,
  portfolioUrl: p.portfolioUrl,
  display: p.display,
  template: p.template,
  accent: p.accent,
  cv: { ...EMPTY_CV, ...p.cv },
  areas: [],
  sample: false,
  hasPage: true,
});

/**
 * Everyone on /people: the PI from the site's data, then members who published a profile.
 * A published profile with the same address as a built-in entry replaces it. The sample
 * placeholders only show while nobody has published a profile yet.
 */
export async function listPublicPeople(db: Db): Promise<PersonView[]> {
  const published = await listPublishedProfiles(db);
  const bySlug = new Map(published.map((p) => [p.slug, p]));
  const builtIn = listPeople().filter((p) => !p.sample || published.length === 0);
  const out: PersonView[] = builtIn.map((s) => {
    const p = bySlug.get(s.slug);
    if (p) {
      bySlug.delete(s.slug);
      return { ...fromProfile(p, s.role === "pi" ? "pi" : "member"), areas: s.areas ?? [] };
    }
    return {
      slug: s.slug,
      name: s.name,
      role: s.role === "pi" ? "pi" : "member",
      headline: s.title,
      bio: s.bio,
      photo: s.photo,
      interests: s.interests,
      links: s.links,
      portfolioUrl: null,
      display: "template",
      template: "classic",
      accent: "yellow",
      cv: EMPTY_CV,
      areas: s.areas ?? [],
      sample: !!s.sample,
      hasPage: !s.sample,
    };
  });
  return [...out, ...[...bySlug.values()].map((p) => fromProfile(p))];
}

export async function getPublicPerson(db: Db, slug: string): Promise<PersonView | null> {
  const p = await getPublishedProfile(db, slug);
  const s = listPeople().find((x) => x.slug === slug && !x.sample);
  if (p) return { ...fromProfile(p, s?.role === "pi" ? "pi" : "member"), areas: s?.areas ?? [] };
  return (await listPublicPeople(db)).find((x) => x.slug === slug && x.hasPage) ?? null;
}
