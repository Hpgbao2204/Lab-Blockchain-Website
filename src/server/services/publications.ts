import { asc, eq } from "drizzle-orm";
import type { z } from "zod";
import type { Db } from "../db/client";
import { hiddenPublications, publicationEntries } from "../db/schema";
import { AppError } from "../errors";
import type { SessionUser } from "../auth/sessions";
import type { publicationInput } from "../validation";
import { requireAdmin } from "./users";
import { publications as snapshot, tagAreas, type Publication, type PublicationKind } from "@/data/publications";
import { researchAreas } from "@/data/research";
import { slugify } from "./news";

type PublicationInput = z.infer<typeof publicationInput>;

export interface AdminPublication extends Publication {
  /** `snapshot`: from the repo (Crossref), can only be hidden. `manual`: added by the admin. */
  source: "snapshot" | "manual";
  hidden: boolean;
}

const toPublication = (r: typeof publicationEntries.$inferSelect): Publication => ({
  id: r.id,
  name: r.name,
  title: r.title,
  year: r.year,
  kind: r.kind as PublicationKind,
  authors: r.authors,
  venue: r.venue,
  doi: r.doi,
  url: r.url,
  areas: r.areas.length ? r.areas : tagAreas(r),
});

const AREA_SLUGS = new Set(researchAreas.map((a) => a.slug));

async function load(db: Db) {
  const [manual, hidden] = await Promise.all([
    db.select().from(publicationEntries).orderBy(asc(publicationEntries.createdAt)),
    db.select({ id: hiddenPublications.id }).from(hiddenPublications),
  ]);
  return { manual: manual.map(toPublication), hidden: new Set(hidden.map((h) => h.id)) };
}

/**
 * What the public site lists: the snapshot plus the admin's additions, minus hidden papers.
 * If the database is unreachable the snapshot alone is still shown.
 */
export async function allPublications(db: Db): Promise<Publication[]> {
  try {
    const { manual, hidden } = await load(db);
    return [...snapshot, ...manual].filter((p) => !hidden.has(p.id));
  } catch (e) {
    console.error("[publications] falling back to the snapshot:", e);
    return snapshot;
  }
}

export async function listAdminPublications(db: Db, actor: SessionUser | null): Promise<AdminPublication[]> {
  requireAdmin(actor);
  const { manual, hidden } = await load(db);
  return [
    ...manual.map((p) => ({ ...p, source: "manual" as const, hidden: hidden.has(p.id) })),
    ...snapshot.map((p) => ({ ...p, source: "snapshot" as const, hidden: hidden.has(p.id) })),
  ].sort((a, b) => b.year - a.year);
}

function values(input: PublicationInput) {
  const areas = (input.areas ?? []).filter((a) => AREA_SLUGS.has(a));
  return {
    name: input.name ?? null,
    title: input.title,
    year: input.year,
    kind: input.kind,
    authors: input.authors,
    venue: input.venue ?? null,
    doi: input.doi ?? null,
    url: input.url ?? null,
    areas,
  };
}

export async function addPublication(db: Db, actor: SessionUser | null, input: PublicationInput) {
  requireAdmin(actor);
  const v = values(input);
  if (v.doi && snapshot.some((p) => p.doi?.toLowerCase() === v.doi!.toLowerCase())) throw new AppError("conflict", "That DOI is already in the list.");
  const taken = new Set([...snapshot.map((p) => p.id), ...(await db.select({ id: publicationEntries.id }).from(publicationEntries)).map((r) => r.id)]);
  const base = slugify(input.name || input.title).slice(0, 50);
  let id = base;
  for (let i = 2; taken.has(id); i++) id = `${base}-${i}`;
  const [row] = await db.insert(publicationEntries).values({ id, ...v, createdBy: actor.id }).returning();
  return toPublication(row);
}

export async function updatePublication(db: Db, actor: SessionUser | null, id: string, input: PublicationInput) {
  requireAdmin(actor);
  const [row] = await db.update(publicationEntries).set(values(input)).where(eq(publicationEntries.id, id)).returning();
  if (!row) throw new AppError(snapshot.some((p) => p.id === id) ? "forbidden" : "not_found", "Only papers added here can be edited; hide the others instead.");
  return toPublication(row);
}

export async function deletePublication(db: Db, actor: SessionUser | null, id: string) {
  requireAdmin(actor);
  const [gone] = await db.delete(publicationEntries).where(eq(publicationEntries.id, id)).returning({ id: publicationEntries.id });
  if (!gone) throw new AppError("not_found", "Only papers added here can be deleted; hide the others instead.");
  await db.delete(hiddenPublications).where(eq(hiddenPublications.id, id));
}

/** Hides or shows any paper, from the snapshot or added by hand. */
export async function setPublicationHidden(db: Db, actor: SessionUser | null, id: string, hidden: boolean) {
  requireAdmin(actor);
  const known = snapshot.some((p) => p.id === id) || (await db.select({ id: publicationEntries.id }).from(publicationEntries).where(eq(publicationEntries.id, id))).length > 0;
  if (!known) throw new AppError("not_found", "Publication not found.");
  if (hidden) await db.insert(hiddenPublications).values({ id }).onConflictDoNothing();
  else await db.delete(hiddenPublications).where(eq(hiddenPublications.id, id));
  return { id, hidden };
}
