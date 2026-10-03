"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { NEWS_KIND, newsDate, type NewsCardData } from "@/components/news/news-card";

export interface AdminNewsItem extends NewsCardData {
  id: string;
  body: string | null;
  link: string | null;
  published: boolean;
}

type FormValue = Omit<AdminNewsItem, "id" | "slug" | "body" | "link"> & { body: string; link: string };

export function NewNews({ today }: { today: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="grid gap-4">
      <button type="button" className="btn btn-yellow btn-sm w-fit" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <Plus size={15} aria-hidden /> Write a news item
      </button>
      {open && <NewsForm initial={{ kind: "news", title: "", summary: "", body: "", link: "", publishedOn: today, published: true }} onDone={() => setOpen(false)} />}
    </div>
  );
}

function NewsForm({ initial, id, onDone }: { initial: FormValue; id?: string; onDone: () => void }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
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
          await api(id ? `/news/${id}` : "/news", { method: id ? "PATCH" : "POST", body: v });
          router.refresh();
          onDone();
        } catch (e) {
          setErr((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="label">
        Type
        <select className="field field-sm" value={v.kind} onChange={set("kind")}>
          {Object.entries(NEWS_KIND).map(([k, { label }]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="label">
        Date <span className="hint">shown on the item; a future date waits until that day</span>
        <input className="field field-sm" type="date" value={v.publishedOn} onChange={set("publishedOn")} required />
      </label>
      <label className="label md:col-span-2">
        Title
        <input className="field field-sm" value={v.title} onChange={set("title")} required maxLength={200} placeholder="e.g. Lotus accepted at IEEE Blockchain 2026" />
      </label>
      <label className="label md:col-span-2">
        Summary <span className="hint">one or two sentences, shown on cards</span>
        <textarea className="field" value={v.summary} onChange={set("summary")} required maxLength={400} />
      </label>
      <label className="label md:col-span-2">
        Full text <span className="hint">optional; leave a blank line between paragraphs</span>
        <textarea className="field min-h-40" value={v.body} onChange={set("body")} maxLength={10000} />
      </label>
      <label className="label md:col-span-2">
        Link <span className="hint">optional, e.g. the paper or event page</span>
        <input className="field field-sm" type="url" value={v.link} onChange={set("link")} maxLength={2000} placeholder="https://…" />
      </label>
      <label className="flex items-center gap-2 text-sm font-bold md:col-span-2">
        <input type="checkbox" className="accent-ink" checked={v.published} onChange={(e) => setV({ ...v, published: e.target.checked })} />
        Published (untick to keep it as a draft only admins see)
      </label>
      <div className="flex flex-wrap gap-2 md:col-span-2">
        <button className="btn btn-ink btn-sm" type="submit" disabled={busy}>
          {busy ? "Saving…" : id ? "Save changes" : "Publish"}
        </button>
        <button className="btn btn-sm" type="button" onClick={onDone}>
          Cancel
        </button>
      </div>
      {err && <p className="error md:col-span-2">{err}</p>}
    </form>
  );
}

export function AdminNewsRow({ item, today }: { item: AdminNewsItem; today: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  if (editing)
    return <NewsForm id={item.id} initial={{ ...item, body: item.body ?? "", link: item.link ?? "" }} onDone={() => setEditing(false)} />;
  const k = NEWS_KIND[item.kind];
  const state = !item.published ? "Draft" : item.publishedOn > today ? "Scheduled" : "Live";
  return (
    <div className="card grid gap-2 p-4" style={{ "--c": k.c } as React.CSSProperties}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="tag">{k.label}</span>
        <span className="mono text-xs text-muted">{newsDate(item.publishedOn)}</span>
        <span className={`tag ${state === "Live" ? "" : "opacity-70"}`} style={{ "--c": state === "Live" ? "var(--color-lime)" : "var(--color-card)" } as React.CSSProperties}>
          {state}
        </span>
      </div>
      <h3 className="font-bold">{item.title}</h3>
      <p className="text-sm text-ink-2">{item.summary}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-xs" onClick={() => setEditing(true)}>
          Edit
        </button>
        <Link href={`/news/${item.slug}`} className="btn btn-xs">
          <Eye size={12} aria-hidden /> View
        </Link>
        <button
          type="button"
          className="btn btn-xs"
          onClick={async () => {
            if (!confirm(`Delete "${item.title}"?`)) return;
            try {
              await api(`/news/${item.id}`, { method: "DELETE" });
              router.refresh();
            } catch (e) {
              alert((e as Error).message);
            }
          }}
        >
          <Trash2 size={12} aria-hidden /> Delete
        </button>
      </div>
    </div>
  );
}
