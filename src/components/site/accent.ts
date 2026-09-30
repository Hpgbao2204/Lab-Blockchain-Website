import type { Accent } from "@/data/research";
import type { PublicationKind } from "@/data/publications";

export const accentVar = (a: Accent) => `var(--color-${a})`;

export const kindAccent: Record<PublicationKind, Accent> = { journal: "yellow", conference: "blue", article: "pink" };
export const kindLabel: Record<PublicationKind, string> = { journal: "Journal", conference: "Conference", article: "Article" };
