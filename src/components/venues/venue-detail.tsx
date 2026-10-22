import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, TriangleAlert } from "lucide-react";
import type { Venue } from "@/server/db/schema";
import { FLAG_LABEL, topicOf, venueHref, type VenueSummary } from "@/lib/venues/topics";
import { VenueCard, venueGrade } from "./venue-card";

type Data = Record<string, unknown>;
const n = (d: Data, k: string) => (typeof d[k] === "number" ? (d[k] as number) : null);
const s = (d: Data, k: string) => (typeof d[k] === "string" && d[k] ? (d[k] as string) : null);
const arr = (d: Data, k: string) => (Array.isArray(d[k]) ? (d[k] as string[]) : []);
const num = (v: number | null, digits = 1) => (v == null ? null : Number.isInteger(v) ? v.toLocaleString("en-US") : v.toLocaleString("en-US", { maximumFractionDigits: digits }));
const pct = (v: number | null) => (v == null ? null : `${num(v, 1)}%`);

const enc = encodeURIComponent;

interface Stat {
  label: string;
  value: string | null;
  note?: string | null;
  src?: string;
}

function Stats({ items }: { items: Stat[] }) {
  const shown = items.filter((i) => i.value != null);
  if (!shown.length) return null;
  return (
    <dl className="venue-stats">
      {shown.map((i) => (
        <div key={i.label} className="venue-stat">
          <dt>{i.label}</dt>
          <dd>
            {i.value}
            {i.note && <small>{i.note}</small>}
          </dd>
          {i.src && <span className="src">{i.src}</span>}
        </div>
      ))}
    </dl>
  );
}

function Facts({ rows }: { rows: [string, React.ReactNode | null][] }) {
  const shown = rows.filter(([, v]) => v != null && v !== "");
  return (
    <dl className="venue-facts">
      {shown.map(([k, v]) => (
        <div key={k} className="contents">
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function venueTitle(v: Venue) {
  return v.acronym ? `${v.acronym}: ${v.name}` : v.name;
}

export function venueMetadata(v: Venue): Metadata {
  const d = v.data as Data;
  const bits =
    v.kind === "conference"
      ? [v.rank && `CORE ${v.rank}`, v.ccf && `CCF ${v.ccf}`, v.hIndex != null && `h5-index ${num(v.hIndex)}`, v.areas.slice(0, 3).join(", ")]
      : [v.quartile && `${d.wosQuartile ? "WoS" : "SCImago"} ${v.quartile}`, v.impact != null && `impact factor ${num(v.impact)}`, v.hIndex != null && `h-index ${num(v.hIndex)}`, v.publisher, v.issn && `ISSN ${v.issn}`];
  return {
    title: venueTitle(v),
    description: `${v.acronym ? `${v.acronym} (${v.name})` : v.name}: ${bits.filter(Boolean).join(" · ")}. Ranks, metrics and similar ${v.kind}s.`,
    alternates: { canonical: venueHref(v) },
  };
}

function Topics({ v }: { v: Venue }) {
  if (!v.topics.length) return null;
  const base = v.kind === "conference" ? "/venues/conferences" : "/venues/journals";
  return (
    <div className="filters">
      {v.topics.map((t) => {
        const topic = topicOf(t);
        return topic ? (
          <Link key={t} href={`${base}?topic=${t}`} className="chip" style={{ "--c": `var(--color-${topic.c})` } as React.CSSProperties} aria-pressed="true">
            {topic.label}
          </Link>
        ) : null;
      })}
    </div>
  );
}

function ExternalLinks({ links }: { links: [string, string][] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {links.map(([label, href]) => (
        <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="btn btn-sm">
          {label} <ArrowUpRight size={15} aria-hidden />
        </a>
      ))}
    </div>
  );
}

export function VenueDetail({ v, similar }: { v: Venue; similar: VenueSummary[] }) {
  const d = v.data as Data;
  const conf = v.kind === "conference";
  const grade = venueGrade({ kind: v.kind, rank: v.rank, ccf: v.ccf, quartile: v.quartile, quartileFrom: v.quartile ? (d.wosQuartile ? "WoS" : "SJR") : null });
  const listHref = conf ? "/venues/conferences" : "/venues/journals";
  const warned = v.flags.includes("warned");

  const links: [string, string][] = conf
    ? [
        ["Calls for papers (WikiCFP)", `http://www.wikicfp.com/cfp/servlet/tool.search?q=${enc(v.acronym ?? v.name)}&year=f`],
        ["Papers on DBLP", `https://dblp.org/search/venue?q=${enc(v.acronym ?? v.name)}`],
        ["Search the web", `https://duckduckgo.com/?q=${enc(`${v.acronym} ${v.name} ${n(d, "latestYear") ?? ""} conference`)}`],
      ]
    : [
        ...(v.issn || v.eissn ? ([["ISSN portal", `https://portal.issn.org/resource/ISSN/${v.issn ?? v.eissn}`]] as [string, string][]) : []),
        ["SCImago", `https://www.scimagojr.com/journalsearch.php?q=${enc(v.issn ?? v.name)}`],
        ["Search the web", `https://duckduckgo.com/?q=${enc(`${v.name} journal ${v.publisher ?? ""}`)}`],
      ];

  const stats: Stat[] = conf
    ? [
        { label: "CORE rank", value: v.rank, src: "CORE / ICORE" },
        { label: "CCF rank", value: v.ccf, src: "China Computer Federation" },
        { label: "h5-index", value: num(v.hIndex), src: "Google Scholar Metrics" },
        { label: "h5-median", value: num(n(d, "h5Median")) },
        { label: "Editions tracked", value: num(n(d, "editions") || null) },
        { label: "Running since", value: n(d, "firstYear") ? String(n(d, "firstYear")) : null },
      ]
    : [
        { label: "Impact factor", value: num(v.impact), note: n(d, "impactChange") != null ? `${n(d, "impactChange")! >= 0 ? "+" : ""}${num(n(d, "impactChange"))}` : null, src: "Clarivate JCR" },
        { label: "WoS quartile", value: s(d, "wosQuartile"), src: "Clarivate JCR, best category" },
        { label: "SJR", value: num(n(d, "sjr"), 3), note: s(d, "sjrQuartile"), src: "SCImago" },
        { label: "h-index", value: num(v.hIndex) },
        { label: "CAS tier", value: s(d, "casTier"), src: "Chinese Academy of Sciences" },
        { label: "Citations per paper", value: num(n(d, "citesPerDoc2y"), 2), src: "last 2 years" },
        { label: "Articles per year", value: num(n(d, "annualArticles")) },
        { label: "Self-citation", value: pct(n(d, "selfCitationRate")) },
        { label: "Fee (APC), est.", value: n(d, "apcUsd") ? `$${num(n(d, "apcUsd"), 0)}` : null, src: "estimated, check the journal" },
      ];

  const edition = [s(d, "city"), v.country, n(d, "latestYear")].filter(Boolean).join(", ");
  const facts: [string, React.ReactNode | null][] = conf
    ? [
        ["Full name", v.name],
        ["Subfields", v.areas.join(", ") || null],
        ["Field of research", s(d, "forName") ? `${s(d, "forName")}${s(d, "forCode") ? ` (FoR ${s(d, "forCode")})` : ""}` : null],
        ["Latest edition", edition || null],
        ["Format", n(d, "virtualEditions") || n(d, "hybridEditions") ? `${n(d, "virtualEditions") ?? 0} virtual, ${n(d, "hybridEditions") ?? 0} hybrid editions` : null],
        ["Organizer", s(d, "organizer")],
        ["Proceedings", v.publisher],
      ]
    : [
        ["ISSN", [v.issn && `${v.issn} (print)`, v.eissn && `${v.eissn} (online)`].filter(Boolean).join(" · ") || null],
        ["Publisher", [v.publisher, s(d, "publisherGroup") !== v.publisher && s(d, "publisherGroup") !== "Other" ? s(d, "publisherGroup") : null].filter(Boolean).join(" · ") || null],
        ["Country", [v.country, s(d, "region")].filter(Boolean).join(" · ") || null],
        ["Indexed in", v.flags.filter((f) => ["scie", "ssci", "ahci", "esci"].includes(f)).map((f) => FLAG_LABEL[f]).join(", ") || null],
        ["Access", [s(d, "oaModel"), n(d, "goldOaRate") != null ? `${pct(n(d, "goldOaRate"))} gold OA` : null].filter(Boolean).join(" · ") || null],
        ["Founded", n(d, "founded") ? String(n(d, "founded")) : null],
        ["Frequency", s(d, "frequency")],
        ["Original research", pct(n(d, "originalResearchRate"))],
        ["Subject areas", v.areas.join(", ") || null],
        ["Categories", arr(d, "researchAreas").join(", ") || null],
        ["Common topics", arr(d, "aiTags").join(", ") || null],
      ];

  return (
    <div className="wrap page grid gap-8">
      <div>
        <ol className="crumbs">
          <li>
            <Link href="/venues">Venues</Link>
          </li>
          <li>
            <Link href={listHref}>{conf ? "Conferences" : "Journals"}</Link>
          </li>
          <li aria-current="page">{v.acronym ?? v.name}</li>
        </ol>
        <header className="card venue-hero" style={{ borderTop: `10px solid ${conf ? "var(--color-blue)" : "var(--color-yellow)"}` }}>
          <span className="venue-grade" style={{ background: grade.color }} aria-label={`${grade.label} ${grade.grade}`}>
            <b>{grade.grade}</b>
            <small>{grade.label}</small>
          </span>
          <div className="grid gap-2">
            <div className="venue-tags">
              <span className="tag">{conf ? "Conference" : "Journal"}</span>
              {v.topTier && (
                <span className="tag" style={{ "--c": "var(--color-lime)" } as React.CSSProperties}>
                  {conf ? "Top tier" : "Top journal"}
                </span>
              )}
              {v.flags.map((f) => (
                <span key={f} className="tag" style={f === "warned" ? ({ "--c": "var(--color-red)" } as React.CSSProperties) : f === "oa" || f === "diamond" ? ({ "--c": "var(--color-teal)" } as React.CSSProperties) : undefined}>
                  {FLAG_LABEL[f]}
                </span>
              ))}
            </div>
            <h1>{v.acronym ?? v.name}</h1>
            <p className="sub">{conf ? v.name : [v.publisher, v.country].filter(Boolean).join(" · ")}</p>
            <div className="mt-2">
              <ExternalLinks links={links} />
            </div>
          </div>
        </header>
      </div>

      {warned && (
        <p className="error m-0 flex gap-3">
          <TriangleAlert size={18} className="mt-0.5 shrink-0" aria-hidden />
          <span>
            This journal is on the Chinese Academy of Sciences early-warning list (for example for unusual citation patterns or very high publication volume). Many universities do not
            count papers in it; ask your supervisor before you submit.
          </span>
        </p>
      )}

      <section aria-labelledby="metrics" className="grid gap-4">
        <h2 id="metrics" className="sr-only">
          Metrics
        </h2>
        <Stats items={stats} />
      </section>

      <section aria-labelledby="about" className="card grid gap-5 p-5 sm:p-7">
        <h2 id="about" className="m-0 font-[family-name:var(--font-display)] text-2xl font-extrabold">
          About {v.acronym ?? "this journal"}
        </h2>
        <Facts rows={facts} />
        <Topics v={v} />
      </section>

      {conf && (
        <p className="note m-0">
          <b>Deadlines</b>
          <span>
            Submission dates change every year. Find the current call for papers on WikiCFP or the conference site, and check the time zone (most use Anywhere on Earth, UTC-12).
          </span>
        </p>
      )}

      {similar.length > 0 && (
        <section aria-labelledby="similar" className="grid gap-4">
          <h2 id="similar" className="m-0 font-[family-name:var(--font-display)] text-2xl font-extrabold">
            Similar {conf ? "conferences" : "journals"}
          </h2>
          <ol className="venue-list">
            {similar.map((x) => (
              <li key={x.slug}>
                <VenueCard v={x} />
              </li>
            ))}
          </ol>
        </section>
      )}

      <p className="m-0 text-sm text-muted">
        Figures as of the last import; ranks are a guide, not a verdict. <Link href={listHref} className="font-bold underline">Back to all {conf ? "conferences" : "journals"}</Link>
      </p>
    </div>
  );
}
