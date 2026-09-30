// Refresh src/data/publications.json from Crossref (works attributed to the PI's ORCID)
// merged with src/data/publications.extra.json (papers Crossref does not attribute yet).
// Usage: npm run sync:publications   (needs network access to api.crossref.org)
import { readFileSync, writeFileSync } from "node:fs";

const ORCID = process.env.PI_ORCID ?? "0000-0003-1156-7072";
const KIND = { "journal-article": "journal", "proceedings-article": "conference", "book-chapter": "conference", "posted-content": "article" };

const res = await fetch(`https://api.crossref.org/works?filter=orcid:${ORCID}&rows=500`, {
  headers: { "User-Agent": "blockchainist-lab-web (mailto:dungtrt@uit.edu.vn)" },
});
if (!res.ok) throw new Error(`Crossref ${res.status}`);
const items = (await res.json()).message.items;

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48).replace(/-$/, "");
const rows = items.map((it) => {
  const full = (it.title?.[0] ?? "").replace(/\s+/g, " ").trim();
  const [head, ...tail] = full.split(":");
  const name = tail.length && head.length <= 32 ? head.trim() : null;
  const rest = name ? tail.join(":").trim() : full;
  const venue = [it["container-title"]?.[0], it["container-title"]?.[1] && `(${it["container-title"][1]})`].filter(Boolean).join(" ") || null;
  return {
    id: slug(name ?? full),
    name,
    title: rest.charAt(0).toUpperCase() + rest.slice(1),
    year: (it.issued?.["date-parts"]?.[0]?.[0]) ?? new Date().getFullYear(),
    kind: KIND[it.type] ?? "article",
    authors: (it.author ?? []).map((a) => [a.given, a.family].filter(Boolean).join(" ")),
    venue,
    doi: it.DOI?.toLowerCase() ?? null,
  };
});

const extra = JSON.parse(readFileSync("src/data/publications.extra.json", "utf8"));
const byId = new Map([...extra, ...rows].map((r) => [r.id, r]));
const out = [...byId.values()].sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
writeFileSync("src/data/publications.json", JSON.stringify(out, null, 2) + "\n");
console.log(`wrote ${out.length} publications (${rows.length} from Crossref, ${extra.length} extra)`);
