/**
 * Whether a member's portfolio may be shown inside /people/[slug]. Sites opt out of being framed
 * with `X-Frame-Options` or CSP `frame-ancestors`; GitHub Pages, Vercel and Netlify sites
 * usually allow it, Notion and LinkedIn do not. When a site refuses, or cannot be reached, the
 * page redirects to it instead, so visitors never see a blank frame.
 */
export function frameAllowed(headers: Headers, siteOrigin: string) {
  const xfo = headers.get("x-frame-options")?.trim().toLowerCase();
  if (xfo && (xfo === "deny" || xfo === "sameorigin" || xfo.startsWith("allow-from"))) return false;
  const csp = headers.get("content-security-policy");
  const directive = csp
    ?.split(",")
    .flatMap((policy) => policy.split(";"))
    .map((d) => d.trim().toLowerCase())
    .find((d) => d.startsWith("frame-ancestors"));
  if (!directive) return true;
  const sources = directive.split(/\s+/).slice(1);
  const site = new URL(siteOrigin);
  return sources.some((s) => {
    if (s === "*" || s === `${site.protocol}`) return true;
    const m = /^(?:([a-z][a-z0-9+.-]*):\/\/)?(\*\.)?([^/:]+)(?::(\d+|\*))?\/?$/.exec(s);
    if (!m) return false;
    const [, scheme, wildcard, host] = m;
    if (scheme && `${scheme}:` !== site.protocol) return false;
    return wildcard ? site.hostname.endsWith(`.${host}`) : site.hostname === host;
  });
}

/**
 * Only public https sites are fetched. When the lab site itself runs on localhost (development,
 * `next start` on a laptop) local http test sites are allowed too.
 */
export function fetchable(url: string, siteOrigin: string) {
  let u: URL, site: URL;
  try {
    u = new URL(url);
    site = new URL(siteOrigin);
  } catch {
    return false;
  }
  if (LOCAL.test(site.hostname)) return u.protocol === "https:" || u.protocol === "http:";
  return u.protocol === "https:" && !LOCAL.test(u.hostname) && !/^\d+\.\d+\.\d+\.\d+$/.test(u.hostname);
}
const LOCAL = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|\[)/;

const cache = new Map<string, { ok: boolean; at: number }>();
const TTL = 30 * 60_000;

export async function canEmbed(url: string, siteOrigin: string, fetcher: typeof fetch = fetch): Promise<boolean> {
  if (!fetchable(url, siteOrigin)) return false;
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < TTL) return hit.ok;
  let ok = false;
  try {
    const res = await fetcher(url, { redirect: "follow", signal: AbortSignal.timeout(4000), headers: { "User-Agent": "BlockchainistBot/1.0 (+portfolio frame check)" } });
    await res.body?.cancel();
    ok = res.ok && frameAllowed(res.headers, siteOrigin) && fetchable(res.url || url, siteOrigin);
  } catch {
    ok = false;
  }
  cache.set(url, { ok, at: Date.now() });
  return ok;
}

export function clearEmbedCache(url?: string) {
  if (url) cache.delete(url);
  else cache.clear();
}
