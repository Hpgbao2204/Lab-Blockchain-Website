/**
 * A small RSS 2.0 / Atom reader, enough for the feeds in src/data/feeds.ts. It takes only the
 * title, link, date and summary (or content) of each entry, with HTML removed.
 */
export interface ParsedItem {
  title: string;
  url: string;
  summary: string;
  publishedAt: Date | null;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…", mdash: "—", ndash: "–", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“" };

export function decodeEntities(s: string) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

const unCdata = (s: string) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");

/** HTML or escaped HTML → plain text on one line per paragraph. */
export function toText(raw: string) {
  let s = unCdata(raw);
  // escaped markup (&lt;p&gt;) is common in RSS descriptions
  if (/&lt;\/?[a-z]/i.test(s)) s = decodeEntities(s);
  s = s
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6]|blockquote)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  return decodeEntities(s)
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function tag(block: string, name: string) {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return m ? m[1] : null;
}

function atomLink(block: string) {
  const links = [...block.matchAll(/<link\b([^>]*)\/?>/gi)].map((m) => m[1]);
  const pick = links.find((a) => /rel=["']alternate["']/i.test(a)) ?? links.find((a) => !/rel=/i.test(a)) ?? links[0];
  return pick?.match(/href=["']([^"']+)["']/i)?.[1] ?? null;
}

function date(s: string | null) {
  if (!s) return null;
  const d = new Date(toText(s));
  return Number.isNaN(d.getTime()) ? null : d;
}

const MAX_SUMMARY = 4000;

export function parseFeed(xml: string): ParsedItem[] {
  const isAtom = /<feed[\s>]/i.test(xml) && !/<rss[\s>]/i.test(xml);
  const blocks = [...xml.matchAll(isAtom ? /<entry[\s>][\s\S]*?<\/entry>/gi : /<item[\s>][\s\S]*?<\/item>/gi)].map((m) => m[0]);
  const items: ParsedItem[] = [];
  for (const b of blocks) {
    const title = toText(tag(b, "title") ?? "");
    let url = isAtom ? atomLink(b) : toText(tag(b, "link") ?? "");
    if (!url && !isAtom) {
      const guid = toText(tag(b, "guid") ?? "");
      if (/^https?:\/\//.test(guid)) url = guid;
    }
    if (!title || !url || !/^https?:\/\//i.test(url)) continue;
    const body = tag(b, "content:encoded") ?? tag(b, "content") ?? tag(b, "description") ?? tag(b, "summary") ?? "";
    items.push({
      title: title.slice(0, 300),
      url: decodeEntities(url.trim()),
      summary: toText(body).slice(0, MAX_SUMMARY),
      publishedAt: date(tag(b, "pubDate") ?? tag(b, "published") ?? tag(b, "updated") ?? tag(b, "dc:date")),
    });
  }
  return items;
}

/** Keeps items that mention one of the words (whole words, case-insensitive) in the title or summary. */
export function matchesFilter(item: Pick<ParsedItem, "title" | "summary">, words: string[] | undefined) {
  if (!words?.length) return true;
  const hay = `${item.title}\n${item.summary}`.toLowerCase();
  return words.some((w) => new RegExp(`(^|[^a-z0-9])${w.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-z0-9])`).test(hay));
}
