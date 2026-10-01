import { and, asc, eq, ne } from "drizzle-orm";
import type { z } from "zod";
import type { Db } from "../db/client";
import { profiles, users } from "../db/schema";
import { AppError } from "../errors";
import type { SessionUser } from "../auth/sessions";
import type { profileInput } from "../validation";

type ProfileInput = z.infer<typeof profileInput>;

/** `Huynh Phan Gia Bao` → `huynh-phan-gia-bao` (Vietnamese marks removed). */
export function slugify(name: string) {
  return (
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/đ/gi, "d")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "member"
  );
}

/** Members edit their own profile; the admin can edit anyone's (e.g. to fill it in or hide it). */
function canEdit(actor: SessionUser | null, userId: string): asserts actor is SessionUser {
  if (!actor) throw new AppError("unauthorized", "Sign in first.");
  if (actor.id !== userId && actor.role !== "admin") throw new AppError("forbidden", "You can only edit your own profile.");
  if (!/^[0-9a-f-]{36}$/i.test(userId)) throw new AppError("not_found", "User not found.");
}

async function freeSlug(db: Db, base: string, userId: string) {
  for (let i = 1; ; i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    const [taken] = await db.select({ id: profiles.userId }).from(profiles).where(and(eq(profiles.slug, slug), ne(profiles.userId, userId)));
    if (!taken) return slug;
  }
}

/** The profile for the editor: the saved one, or an unpublished draft prefilled from the account. */
export async function getProfileForEdit(db: Db, actor: SessionUser | null, userId: string) {
  canEdit(actor, userId);
  const [u] = await db.select({ id: users.id, name: users.name, title: users.title }).from(users).where(eq(users.id, userId));
  if (!u) throw new AppError("not_found", "User not found.");
  const [p] = await db.select().from(profiles).where(eq(profiles.userId, userId));
  if (p) return { user: u, profile: p, saved: true };
  return {
    user: u,
    saved: false,
    profile: {
      userId,
      slug: await freeSlug(db, slugify(u.name), userId),
      headline: u.title,
      bio: null,
      photoUrl: null,
      portfolioUrl: null,
      links: [],
      interests: [],
      cv: { education: [], experience: [], projects: [], awards: [] },
      display: "template" as const,
      template: "classic",
      accent: "yellow",
      published: false,
      updatedAt: new Date(),
    },
  };
}

export async function saveProfile(db: Db, actor: SessionUser | null, userId: string, input: ProfileInput) {
  canEdit(actor, userId);
  const [u] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId));
  if (!u) throw new AppError("not_found", "User not found.");
  if (input.display === "portfolio" && !input.portfolioUrl) throw new AppError("invalid_input", "Add your portfolio link, or choose the built-in CV.");
  const [taken] = await db.select({ id: profiles.userId }).from(profiles).where(and(eq(profiles.slug, input.slug), ne(profiles.userId, userId)));
  if (taken) throw new AppError("conflict", "That page address is taken. Try another.");
  const values = {
    slug: input.slug,
    headline: input.headline ?? null,
    bio: input.bio ?? null,
    photoUrl: input.photoUrl ?? null,
    portfolioUrl: input.portfolioUrl ?? null,
    links: input.links,
    interests: input.interests,
    cv: input.cv,
    display: input.display,
    template: input.template,
    accent: input.accent,
    published: input.published,
    updatedAt: new Date(),
  };
  const [p] = await db
    .insert(profiles)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: profiles.userId, set: values })
    .returning();
  return p;
}

const publicColumns = {
  slug: profiles.slug,
  name: users.name,
  headline: profiles.headline,
  bio: profiles.bio,
  photoUrl: profiles.photoUrl,
  portfolioUrl: profiles.portfolioUrl,
  links: profiles.links,
  interests: profiles.interests,
  cv: profiles.cv,
  display: profiles.display,
  template: profiles.template,
  accent: profiles.accent,
  updatedAt: profiles.updatedAt,
};
export type PublicProfile = Awaited<ReturnType<typeof listPublishedProfiles>>[number];

/** Published profiles of active accounts, for /people. No email or account data leaves here. */
export function listPublishedProfiles(db: Db) {
  return db
    .select(publicColumns)
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .where(and(eq(profiles.published, true), eq(users.active, true)))
    .orderBy(asc(users.name));
}

export async function getPublishedProfile(db: Db, slug: string) {
  const [p] = await db
    .select(publicColumns)
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .where(and(eq(profiles.slug, slug), eq(profiles.published, true), eq(users.active, true)))
    .limit(1);
  return p ?? null;
}

/** A GitHub link doubles as a photo source when no photo URL is given. */
export function profilePhoto(p: { photoUrl: string | null; links: { url: string }[] }) {
  if (p.photoUrl) return p.photoUrl;
  for (const l of p.links) {
    const m = /^https?:\/\/(?:www\.)?github\.com\/([A-Za-z0-9-]{1,39})\/?$/.exec(l.url);
    if (m) return `https://github.com/${m[1]}.png?size=400`;
  }
  return null;
}
