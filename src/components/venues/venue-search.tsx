"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Search, SlidersHorizontal, X } from "lucide-react";
import type { VenueBrowse, VenueFacets } from "@/server/services/venues";
import { CCF_RANKS, CORE_RANKS, FLAG_LABEL, JOURNAL_INDEXES, POPULAR_VENUES, QUARTILES, VENUE_SORTS, VENUE_TOPICS, type VenueKind, type VenueSummary } from "@/lib/venues/topics";
import { VenueCard } from "./venue-card";

export interface VenueFilters {
  q: string;
  kind: VenueKind | "";
  topic: string;
  area: string;
  rank: string[];
  ccf: string[];
  quartile: string[];
  index: string[];
  oa: boolean;
  top: boolean;
  safe: boolean;
  sort: string;
}

export const EMPTY_FILTERS: VenueFilters = { q: "", kind: "", topic: "", area: "", rank: [], ccf: [], quartile: [], index: [], oa: false, top: false, safe: false, sort: "" };

/** Filters → query string, leaving out defaults; `kind` is part of the path on the site. */
export function filterParams(f: VenueFilters, withKind: boolean) {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set("q", f.q.trim());
  if (withKind && f.kind) p.set("kind", f.kind);
  if (f.topic) p.set("topic", f.topic);
  if (f.top) p.set("top", "1");
  if (f.kind && f.area) p.set("area", f.area);
  if (f.kind === "conference") {
    if (f.rank.length) p.set("rank", f.rank.join(","));
    if (f.ccf.length) p.set("ccf", f.ccf.join(","));
  }
  if (f.kind === "journal") {
    if (f.quartile.length) p.set("quartile", f.quartile.join(","));
    if (f.index.length) p.set("index", f.index.join(","));
    if (f.oa) p.set("oa", "1");
    if (f.safe) p.set("safe", "1");
  }
  if (f.kind && f.sort) p.set("sort", f.sort);
  return p;
}

const pathFor = (kind: VenueKind | "") => (kind === "conference" ? "/venues/conferences" : kind === "journal" ? "/venues/journals" : "/venues");
const KIND_LABEL: Record<VenueKind, string> = { conference: "Conferences", journal: "Journals" };
const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

interface Props {
  initial: VenueBrowse;
  filters: VenueFilters;
  facets: VenueFacets;
}

/**
 * Search box, topic chips, kind tabs, filters and results. The first page is rendered on the
 * server from the URL; later changes call `GET /api/v1/venues` and keep the URL in step, so any
 * view can be shared or bookmarked.
 */
export function VenueSearch({ initial, filters, facets }: Props) {
  const [f, setF] = useState(filters);
  const [res, setRes] = useState(initial);
  const [extra, setExtra] = useState<VenueSummary[]>([]);
  const [page, setPage] = useState(initial.page);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [showFilters, setShowFilters] = useState(false);
  const [allAreas, setAllAreas] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const first = useRef(true);

  const set = (patch: Partial<VenueFilters>) => setF((cur) => ({ ...cur, ...patch }));
  const query = useMemo(() => filterParams(f, true).toString(), [f]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const url = `${pathFor(f.kind)}${filterParams(f, false).size ? `?${filterParams(f, false)}` : ""}`;
    window.history.replaceState(null, "", url);
    const ctrl = new AbortController();
    const t = window.setTimeout(async () => {
      setState("loading");
      try {
        const r = await fetch(`/api/v1/venues?${query}`, { signal: ctrl.signal });
        if (!r.ok) throw new Error(String(r.status));
        const body = (await r.json()) as { data: VenueSummary[] | Record<VenueKind, VenueSummary[]>; meta: Omit<VenueBrowse, "items" | "groups" | "kind"> };
        const kind = f.kind || null;
        setRes({ ...body.meta, kind, items: kind ? (body.data as VenueSummary[]) : [], groups: kind ? null : (body.data as Record<VenueKind, VenueSummary[]>) });
        setExtra([]);
        setPage(1);
        setState("idle");
      } catch (e) {
        if ((e as Error).name !== "AbortError") setState("error");
      }
    }, 220);
    return () => {
      ctrl.abort();
      window.clearTimeout(t);
    };
    // `query` already reflects every filter
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // "/" jumps to the search box, as on most search sites
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && !el.isContentEditable) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function loadMore() {
    setState("loading");
    try {
      const r = await fetch(`/api/v1/venues?${query}&page=${page + 1}`);
      if (!r.ok) throw new Error(String(r.status));
      const body = (await r.json()) as { data: VenueSummary[] };
      setExtra((cur) => [...cur, ...body.data]);
      setPage((p) => p + 1);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  const kind = f.kind || null;
  const activeFilters = filterParams({ ...f, q: "", topic: "", kind: f.kind, sort: "" }, false).size;
  const areas = kind ? facets.areas[kind] : [];
  const items = [...res.items, ...extra];
  const empty = kind ? !items.length : !res.groups?.conference.length && !res.groups?.journal.length;

  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <label className="venue-search">
          <span className="sr-only">Search conferences and journals</span>
          <Search size={20} aria-hidden />
          <input
            ref={input}
            className="field"
            type="search"
            autoComplete="off"
            spellCheck={false}
            placeholder="Acronym, name or ISSN (CVPR, IEEE Access)"
            value={f.q}
            onChange={(e) => set({ q: e.target.value })}
          />
          {!f.q && <kbd aria-hidden>/</kbd>}
        </label>
        <div className="venue-scroll flex items-center gap-2 text-sm min-[561px]:flex-wrap">
          <span className="mono text-xs text-muted">Popular:</span>
          {POPULAR_VENUES.map((p) => (
            <button key={p} type="button" className="chip" aria-pressed={f.q === p} onClick={() => set({ q: f.q === p ? "" : p })}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <nav aria-label="Topics" className="venue-scroll filters">
        <button type="button" className="chip" aria-pressed={!f.topic} onClick={() => set({ topic: "" })}>
          All topics
        </button>
        {VENUE_TOPICS.filter((t) => facets.topics[t.slug]).map((t) => (
          <button
            key={t.slug}
            type="button"
            className="chip"
            aria-pressed={f.topic === t.slug}
            style={{ "--c": `var(--color-${t.c})` } as React.CSSProperties}
            onClick={() => set({ topic: f.topic === t.slug ? "" : t.slug })}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="venue-tabs" role="tablist" aria-label="Kind of venue">
        {(["", "conference", "journal"] as const).map((k) => (
          <button key={k || "all"} type="button" role="tab" className="venue-tab" aria-selected={f.kind === k} onClick={() => set({ kind: k, area: "", sort: "" })}>
            {k ? KIND_LABEL[k] : "All"} <b>{(k ? res.counts[k] : res.counts.conference + res.counts.journal).toLocaleString("en-US")}</b>
          </button>
        ))}
      </div>

      <div className="venue-layout">
        <div className="grid gap-3">
          <button type="button" className="btn btn-sm w-fit min-[901px]:hidden" aria-expanded={showFilters} aria-controls="venue-filters" onClick={() => setShowFilters((v) => !v)}>
            <SlidersHorizontal size={15} aria-hidden /> Filters{activeFilters ? ` (${activeFilters})` : ""}
          </button>
          <aside id="venue-filters" className={`venue-filters ${showFilters ? "open" : ""}`} aria-label="Filters">
            {kind && (
              <div>
                <h3>Sort by</h3>
                <select className="field field-sm" value={f.sort} onChange={(e) => set({ sort: e.target.value })}>
                  <option value="">{f.q ? "Best match" : VENUE_SORTS.best}</option>
                  {(Object.keys(VENUE_SORTS) as (keyof typeof VENUE_SORTS)[])
                    .filter((s) => f.q || s !== "best")
                    .map((s) => (
                      <option key={s} value={s}>
                        {s === "h" && kind === "conference" ? "Highest h5-index" : VENUE_SORTS[s]}
                      </option>
                    ))}
                </select>
              </div>
            )}
            <label className="venue-check">
              <input type="checkbox" checked={f.top} onChange={(e) => set({ top: e.target.checked })} />
              {kind === "journal" ? "Top journals only" : "Top tier only"}
            </label>

            {kind === "conference" && (
              <>
                <div>
                  <h3>CORE rank</h3>
                  <div className="filters">
                    {CORE_RANKS.map((r) => (
                      <button key={r} type="button" className="chip" aria-pressed={f.rank.includes(r)} onClick={() => set({ rank: toggle(f.rank, r) })}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3>CCF rank</h3>
                  <div className="filters">
                    {CCF_RANKS.map((r) => (
                      <button key={r} type="button" className="chip" aria-pressed={f.ccf.includes(r)} onClick={() => set({ ccf: toggle(f.ccf, r) })}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {kind === "journal" && (
              <>
                <div>
                  <h3>Quartile</h3>
                  <div className="filters">
                    {QUARTILES.map((r) => (
                      <button key={r} type="button" className="chip" aria-pressed={f.quartile.includes(r)} onClick={() => set({ quartile: toggle(f.quartile, r) })}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3>Indexed in</h3>
                  <div className="filters">
                    {JOURNAL_INDEXES.map((r) => (
                      <button key={r} type="button" className="chip" aria-pressed={f.index.includes(r)} onClick={() => set({ index: toggle(f.index, r) })}>
                        {FLAG_LABEL[r]}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="venue-check">
                  <input type="checkbox" checked={f.oa} onChange={(e) => set({ oa: e.target.checked })} /> Open access only
                </label>
                <label className="venue-check">
                  <input type="checkbox" checked={f.safe} onChange={(e) => set({ safe: e.target.checked })} /> Hide CAS-warned journals
                </label>
              </>
            )}

            {kind && areas.length > 0 && (
              <div>
                <h3>{kind === "conference" ? "Subfield" : "Subject area"}</h3>
                <ul className="venue-areas">
                  {(allAreas ? areas : areas.slice(0, 10)).map((a) => (
                    <li key={a.name}>
                      <button type="button" aria-pressed={f.area === a.name} onClick={() => set({ area: f.area === a.name ? "" : a.name })}>
                        <span>{a.name}</span> <small>{a.n.toLocaleString("en-US")}</small>
                      </button>
                    </li>
                  ))}
                </ul>
                {areas.length > 10 && (
                  <button type="button" className="mono mt-1 cursor-pointer text-xs underline" onClick={() => setAllAreas((v) => !v)}>
                    {allAreas ? "Show fewer" : `Show all ${areas.length}`}
                  </button>
                )}
              </div>
            )}

            {!kind && <p className="m-0 text-sm text-muted">Pick Conferences or Journals above for rank, subfield and index filters.</p>}

            {(activeFilters > 0 || f.topic || f.q) && (
              <button type="button" className="btn btn-sm w-fit" onClick={() => setF({ ...EMPTY_FILTERS, kind: f.kind })}>
                <X size={14} aria-hidden /> Clear all
              </button>
            )}
          </aside>
        </div>

        <section aria-label="Results" className="grid content-start gap-4" style={{ opacity: state === "loading" ? 0.6 : 1, transition: "opacity .2s" }}>
          <p className="mono m-0 text-xs text-muted" aria-live="polite">
            {state === "error"
              ? "Could not load, try again."
              : kind
                ? `${res.total.toLocaleString("en-US")} ${res.total === 1 ? kind : `${kind}s`}${f.q.trim() ? ` for “${f.q.trim()}”` : ""}`
                : `${(res.counts.conference + res.counts.journal).toLocaleString("en-US")} venues${f.q.trim() ? ` for “${f.q.trim()}”` : ""}`}
          </p>
          {res.fuzzy && (
            <p className="note m-0">
              <b>Close match</b>
              <span>Nothing matches “{f.q.trim()}” exactly; these are spelled the most like it.</span>
            </p>
          )}

          {empty && (
            <div className="card grid justify-items-start gap-3 p-6">
              <p className="m-0 font-bold">No venue matches these filters.</p>
              <p className="m-0 text-sm text-muted">Try fewer filters, another topic, or search by the acronym (e.g. “ICSE”) or ISSN.</p>
              <button type="button" className="btn btn-sm" onClick={() => setF(EMPTY_FILTERS)}>
                Start over
              </button>
            </div>
          )}

          {kind ? (
            <>
              <ol className="venue-list">
                {items.map((v) => (
                  <li key={v.slug}>
                    <VenueCard v={v} />
                  </li>
                ))}
              </ol>
              {page < res.pages && (
                <button type="button" className="btn mx-auto" disabled={state === "loading"} onClick={loadMore}>
                  Show more ({(res.total - items.length).toLocaleString("en-US")} left)
                </button>
              )}
            </>
          ) : (
            res.groups &&
            (["conference", "journal"] as const).map((k) =>
              res.groups![k].length ? (
                <section key={k} className="grid gap-3" aria-labelledby={`group-${k}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 id={`group-${k}`} className="m-0 font-[family-name:var(--font-display)] text-xl font-extrabold">
                      {KIND_LABEL[k]} <span className="mono text-sm font-normal text-muted">{res.counts[k].toLocaleString("en-US")}</span>
                    </h2>
                    {res.counts[k] > res.groups![k].length && (
                      <button type="button" className="btn btn-sm" onClick={() => set({ kind: k })}>
                        All {res.counts[k].toLocaleString("en-US")} {KIND_LABEL[k].toLowerCase()} <ArrowRight size={15} aria-hidden />
                      </button>
                    )}
                  </div>
                  <ol className="venue-list">
                    {res.groups![k].map((v) => (
                      <li key={v.slug}>
                        <VenueCard v={v} />
                      </li>
                    ))}
                  </ol>
                </section>
              ) : null,
            )
          )}
        </section>
      </div>
    </div>
  );
}
