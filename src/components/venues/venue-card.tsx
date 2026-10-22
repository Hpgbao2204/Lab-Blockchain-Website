import Link from "next/link";
import { FLAG_LABEL, rankColor, venueHref, type VenueSummary } from "@/lib/venues/topics";

const fmt = (n: number | null, digits = 1) => (n == null ? null : Number.isInteger(n) ? n.toLocaleString("en-US") : n.toFixed(digits));

/** The big square on the left of a card: the one rank a reader scans for. */
export function venueGrade(v: Pick<VenueSummary, "kind" | "rank" | "ccf" | "quartile" | "quartileFrom">) {
  if (v.kind === "conference") {
    if (v.rank) return { grade: v.rank, label: "CORE", color: rankColor(v.rank) };
    if (v.ccf) return { grade: v.ccf, label: "CCF", color: rankColor(v.ccf) };
    return { grade: "–", label: "unranked", color: rankColor(null) };
  }
  if (v.quartile) return { grade: v.quartile, label: v.quartileFrom ?? "", color: rankColor(v.quartile) };
  return { grade: "–", label: "no quartile", color: rankColor(null) };
}

export function VenueCard({ v, headingLevel = 3 }: { v: VenueSummary; headingLevel?: 2 | 3 }) {
  const g = venueGrade(v);
  const H = `h${headingLevel}` as "h2" | "h3";
  const where =
    v.kind === "conference"
      ? [v.edition?.city, v.edition?.country, v.edition?.year].filter(Boolean).join(", ")
      : [v.publisher, v.issn && `ISSN ${v.issn}`, v.country].filter(Boolean).join(" · ");
  const metrics =
    v.kind === "conference"
      ? [["h5-index", fmt(v.hIndex, 0)]]
      : [
          ["Impact factor", fmt(v.impact)],
          ["h-index", fmt(v.hIndex, 0)],
          ["SJR", fmt(v.sjr, 2)],
        ];
  const shown = metrics.filter(([, val]) => val != null);
  return (
    <Link href={venueHref(v)} className="venue" style={{ "--c": v.kind === "conference" ? "var(--color-blue)" : "var(--color-yellow)" } as React.CSSProperties}>
      <span className="venue-grade" style={{ background: g.color }} aria-label={`${g.label} ${g.grade}`}>
        <b>{g.grade}</b>
        <small>{g.label}</small>
      </span>
      <span className="venue-body">
        <span className="venue-tags">
          <span className="tag">{v.kind}</span>
          {v.topTier && (
            <span className="tag" style={{ "--c": "var(--color-lime)" } as React.CSSProperties}>
              {v.kind === "conference" ? "Top tier" : "Top journal"}
            </span>
          )}
          {v.kind === "conference" && v.rank && v.ccf && <span className="tag">CCF {v.ccf}</span>}
          {v.kind === "journal" &&
            v.flags
              .filter((f) => f !== "review" && f !== "diamond")
              .map((f) => (
                <span key={f} className="tag" style={f === "warned" ? ({ "--c": "var(--color-red)" } as React.CSSProperties) : f === "oa" ? ({ "--c": "var(--color-teal)" } as React.CSSProperties) : undefined}>
                  {FLAG_LABEL[f]}
                </span>
              ))}
        </span>
        <H className="venue-title">
          {v.acronym && <span className="venue-acr">{v.acronym}</span>}
          {v.name}
        </H>
        {(where || v.areas.length > 0) && (
          <span className="venue-meta">
            {where}
            {where && v.areas.length > 0 && " · "}
            {v.areas.slice(0, 3).join(", ")}
          </span>
        )}
        {shown.length > 0 && (
          <span className="venue-metrics">
            {shown.map(([k, val]) => (
              <span key={k}>
                <small>{k}</small> <b>{val}</b>
              </span>
            ))}
          </span>
        )}
      </span>
    </Link>
  );
}
