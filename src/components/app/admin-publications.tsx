"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api/client";

export interface AdminPub {
  id: string;
  name: string | null;
  title: string;
  year: number;
  kind: "journal" | "conference" | "article";
  authors: string[];
  venue: string | null;
  doi: string | null;
  url?: string | null;
  areas: string[];
  source: "snapshot" | "manual";
  hidden: boolean;
}
type Area = { slug: string; title: string };

interface FormValue {
  name: string;
  title: string;
  year: string;
  kind: AdminPub["kind"];
  authors: string;
  venue: string;
  doi: string;
  url: string;
  areas: string[];
}

const toForm = (p?: AdminPub): FormValue => ({
  name: p?.name ?? "",
  title: p?.title ?? "",
  year: String(p?.year ?? new Date().getFullYear()),
  kind: p?.kind ?? "conference",
  authors: p?.authors.join("\n") ?? "",
  venue: p?.venue ?? "",
  doi: p?.doi ?? "",
  url: p?.url ?? "",
  areas: p?.areas ?? [],
});

function PubForm({ areas, pub, onDone }: { areas: Area[]; pub?: AdminPub; onDone: () => void }) {
  const router = useRouter();
  const [v, setV] = useState(toForm(pub));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof FormValue) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setV({ ...v, [k]: e.target.value });

  return (
    <form
      className="card grid gap-3 p-4 md:grid-cols-2"
      style={{ boxShadow: "var(--shadow)" }}
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr(null);
        try {
          const authors = v.authors
            .split(/\n|;|,(?![^()]*\))/)
            .map((a) => a.trim())
            .filter(Boolean);
          const body = { ...v, year: Number(v.year), authors, areas: v.areas.length ? v.areas : undefined };
          await api(pub ? `/admin/publications/${pub.id}` : "/admin/publications", { method: pub ? "PATCH" : "POST", body });
          router.refresh();
          onDone();
        } catch (e) {
          setErr((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="label md:col-span-2">
        Title
        <input className="field field-sm" value={v.title} onChange={set("title")} required maxLength={400} />
      </label>
      <label className="label">
        Short name <span className="hint">optional, e.g. Lotus</span>
        <input className="field field-sm" value={v.name} onChange={set("name")} maxLength={80} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="label">
          Year
          <input className="field field-sm" type="number" min={1990} max={2100} value={v.year} onChange={set("year")} required />
        </label>
        <label className="label">
          Type
          <select className="field field-sm" value={v.kind} onChange={set("kind")}>
            <option value="journal">Journal</option>
            <option value="conference">Conference</option>
            <option value="article">Article</option>
          </select>
        </label>
      </div>
      <label className="label">
        Authors <span className="hint">one per line, in order</span>
        <textarea className="field field-sm min-h-24" value={v.authors} onChange={set("authors")} required />
      </label>
      <div className="grid content-start gap-3">
        <label className="label">
          Venue <span className="hint">journal or conference</span>
          <input className="field field-sm" value={v.venue} onChange={set("venue")} maxLength={300} />
        </label>
        <label className="label">
          DOI <span className="hint">optional, e.g. 10.1109/…</span>
          <input className="field field-sm" value={v.doi} onChange={set("doi")} maxLength={200} />
        </label>
        <label className="label">
          Link <span className="hint">optional, used when there is no DOI</span>
          <input className="field field-sm" type="url" value={v.url} onChange={set("url")} maxLength={2000} placeholder="https://…" />
        </label>
      </div>
      <fieldset className="grid gap-2 md:col-span-2">
        <legend className="label mb-1">
          Research directions <span className="hint">none ticked: guessed from the title</span>
        </legend>
        <ul className="flex flex-wrap gap-2">
          {areas.map((a) => {
            const on = v.areas.includes(a.slug);
            return (
              <li key={a.slug}>
                <label className={`btn btn-xs cursor-pointer ${on ? "btn-yellow" : ""}`}>
                  <input type="checkbox" className="sr-only" checked={on} onChange={() => setV({ ...v, areas: on ? v.areas.filter((x) => x !== a.slug) : [...v.areas, a.slug] })} />
                  {a.title}
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>
      <div className="flex flex-wrap gap-2 md:col-span-2">
        <button className="btn btn-ink btn-sm" type="submit" disabled={busy}>
          {busy ? "Saving…" : pub ? "Save changes" : "Add paper"}
        </button>
        <button className="btn btn-sm" type="button" onClick={onDone}>
          Cancel
        </button>
      </div>
      {err && <p className="error md:col-span-2">{err}</p>}
    </form>
  );
}

function Row({ p, areas }: { p: AdminPub; areas: Area[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const act = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      router.refresh();
    } catch (e) {
      alert((e as Error).message);
    }
  };
  if (editing) return <PubForm areas={areas} pub={p} onDone={() => setEditing(false)} />;
  return (
    <li className={`card grid gap-1.5 p-3 ${p.hidden ? "opacity-55" : ""}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="mono text-xs font-bold">{p.year}</span>
        <span className="tag">{p.kind}</span>
        {p.source === "manual" && <span className="tag" style={{ "--c": "var(--color-yellow)" } as React.CSSProperties}>added here</span>}
        {p.hidden && <span className="tag">hidden</span>}
      </div>
      <p className="text-sm font-bold leading-snug">
        {p.name ? `${p.name}: ` : ""}
        {p.title}
      </p>
      <p className="text-xs text-muted">{[p.authors.slice(0, 6).join(", ") + (p.authors.length > 6 ? ", …" : ""), p.venue].filter(Boolean).join(" · ")}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-xs" onClick={() => act(() => api(`/admin/publications/${p.id}`, { method: "PATCH", body: { hidden: !p.hidden } }))}>
          {p.hidden ? <Eye size={12} aria-hidden /> : <EyeOff size={12} aria-hidden />} {p.hidden ? "Show" : "Hide"}
        </button>
        {p.source === "manual" && (
          <>
            <button type="button" className="btn btn-xs" onClick={() => setEditing(true)}>
              Edit
            </button>
            <button type="button" className="btn btn-xs" onClick={() => confirm(`Delete "${p.title}"?`) && act(() => api(`/admin/publications/${p.id}`, { method: "DELETE" }))}>
              <Trash2 size={12} aria-hidden /> Delete
            </button>
          </>
        )}
      </div>
    </li>
  );
}

export function PublicationsAdmin({ pubs, areas }: { pubs: AdminPub[]; areas: Area[] }) {
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? pubs.filter((p) => [p.name ?? "", p.title, p.venue ?? "", String(p.year), ...p.authors].join(" ").toLowerCase().includes(s)) : pubs;
  }, [pubs, q]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-yellow btn-sm" onClick={() => setAdding((v) => !v)} aria-expanded={adding}>
          <Plus size={15} aria-hidden /> Add a paper
        </button>
        <input className="field field-sm max-w-xs" type="search" placeholder="Filter by title, author, year…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter papers" />
        <span className="mono text-xs text-muted">
          {shown.length} of {pubs.length} · {pubs.filter((p) => p.hidden).length} hidden
        </span>
      </div>
      {adding && <PubForm areas={areas} onDone={() => setAdding(false)} />}
      <ul className="grid gap-3 lg:grid-cols-2">
        {shown.map((p) => (
          <Row key={p.id} p={p} areas={areas} />
        ))}
      </ul>
    </div>
  );
}
