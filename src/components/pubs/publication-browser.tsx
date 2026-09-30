"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { Publication, PublicationKind } from "@/data/publications";
import { accentVar, kindAccent, kindLabel } from "@/components/site/accent";
import { PublicationCard } from "./publication-card";

interface Facets {
  total: number;
  byKind: Record<PublicationKind, number>;
  years: number[];
}

interface Props {
  initial: Publication[];
  facets: Facets;
  areas: { slug: string; title: string }[];
}

/** Filters run against `GET /api/v1/publications`; the first page is server-rendered. */
export function PublicationBrowser({ initial, facets, areas }: Props) {
  const [kind, setKind] = useState<PublicationKind | "">("");
  const [year, setYear] = useState("");
  const [area, setArea] = useState("");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState(initial);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const ctrl = new AbortController();
    const params = new URLSearchParams(Object.entries({ kind, year, area, q: q.trim() }).filter(([, v]) => v));
    const t = window.setTimeout(async () => {
      setState("loading");
      try {
        const res = await fetch(`/api/v1/publications?${params}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as { data: Publication[] };
        setRows(body.data);
        setState("idle");
      } catch (e) {
        if ((e as Error).name !== "AbortError") setState("error");
      }
    }, 180);
    return () => {
      ctrl.abort();
      window.clearTimeout(t);
    };
  }, [kind, year, area, q]);

  const kinds: (PublicationKind | "")[] = ["", ...(["journal", "conference", "article"] as const).filter((k) => facets.byKind[k] > 0)];

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
        <label className="relative">
          <span className="sr-only">Search publications</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={18} aria-hidden />
          <input className="field pl-10!" type="search" placeholder="Search title, venue or author" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <label>
          <span className="sr-only">Year</span>
          <select className="field" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">All years</option>
            {facets.years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Research direction</span>
          <select className="field" value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">All directions</option>
            {areas.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="filters" role="group" aria-label="Filter by type">
        {kinds.map((k) => (
          <button
            key={k || "all"}
            type="button"
            className="chip"
            aria-pressed={kind === k}
            style={k ? ({ "--c": accentVar(kindAccent[k]) } as React.CSSProperties) : undefined}
            onClick={() => setKind(k)}
          >
            {k ? kindLabel[k] : "All"} <b>{k ? facets.byKind[k] : facets.total}</b>
          </button>
        ))}
        <span className="mono ml-auto self-center text-xs text-muted" aria-live="polite">
          {state === "loading" ? "querying /api/v1/publications…" : state === "error" ? "Could not load, try again." : `${rows.length} result${rows.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {rows.length ? (
        <ol className="pubs" style={{ opacity: state === "loading" ? 0.6 : 1, transition: "opacity .2s" }}>
          {rows.map((p, i) => (
            <PublicationCard key={p.id} pub={p} no={i + 1} />
          ))}
        </ol>
      ) : (
        <p className="card p-6 text-center">No publications match these filters.</p>
      )}
    </div>
  );
}
