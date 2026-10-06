"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Bold, Code, Eye, Heading2, ImagePlus, Italic, Link2, List, Quote, Send, Undo2 } from "lucide-react";
import { api, ApiError } from "@/lib/api/client";
import { ARTICLE_KINDS, NEWS_KIND, type NewsKind } from "@/components/news/news-card";
import { Markdown } from "@/components/news/markdown";

export interface EditablePost {
  id?: string;
  slug?: string;
  kind: NewsKind;
  title: string;
  summary: string;
  body: string;
  sources: string;
  cover: string;
  link: string;
  publishedOn: string;
  status: "draft" | "submitted" | "published" | "rejected";
  reviewNote?: string | null;
}

const NEEDS_SOURCES: NewsKind[] = ["protocol", "paper_review", "incident"];
const STATUS_TEXT: Record<EditablePost["status"], string> = {
  draft: "Draft · only you and the admins see it",
  submitted: "Waiting for review",
  published: "Published",
  rejected: "Sent back · edit and submit again",
};

function Tool({ label, icon, onClick, disabled }: { label: string; icon: React.ReactNode; onClick: () => void; disabled: boolean }) {
  return (
    <button type="button" className="btn btn-xs" onClick={onClick} title={label} aria-label={label} disabled={disabled}>
      {icon}
    </button>
  );
}

async function uploadImage(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/v1/images", { method: "POST", body: form, credentials: "same-origin" });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error?.message ?? `Upload failed (${res.status})`);
  return json.data.url as string;
}

/**
 * Writing a post: Markdown with a small toolbar, image upload and a live preview. Members save
 * drafts and submit them for review; admins can also publish directly and pick the date.
 */
export function PostEditor({ initial, admin }: { initial: EditablePost; admin: boolean }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  const locked = !admin && v.status === "published";
  const kinds = admin ? (Object.keys(NEWS_KIND) as NewsKind[]) : ARTICLE_KINDS;
  const set = (k: keyof EditablePost) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setV({ ...v, [k]: e.target.value });

  /** Wraps the selection (or inserts a placeholder) with Markdown marks. */
  const wrap = (before: string, after = "", placeholder = "") => {
    const ta = area.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    const chosen = v.body.slice(s, e) || placeholder;
    const body = v.body.slice(0, s) + before + chosen + after + v.body.slice(e);
    setV({ ...v, body });
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(s + before.length, s + before.length + chosen.length);
    });
  };
  const linePrefix = (prefix: string) => {
    const ta = area.current;
    if (!ta) return;
    const start = v.body.lastIndexOf("\n", ta.selectionStart - 1) + 1;
    setV({ ...v, body: v.body.slice(0, start) + prefix + v.body.slice(start) });
    requestAnimationFrame(() => ta.focus());
  };

  const payload = () => ({
    kind: v.kind,
    title: v.title,
    summary: v.summary,
    body: v.body,
    sources: v.sources,
    cover: v.cover,
    link: v.link,
    ...(admin ? { publishedOn: v.publishedOn } : {}),
  });

  async function save(then?: "submit" | "publish" | "draft") {
    setBusy(then ?? "save");
    setMsg(null);
    try {
      const body = { ...payload(), ...(admin && then === "publish" ? { status: "published" } : admin && then === "draft" ? { status: "draft" } : {}) };
      const saved = await api<{ id: string; slug: string; status: EditablePost["status"] }>(v.id ? `/news/${v.id}` : "/news", { method: v.id ? "PATCH" : "POST", body });
      // remember the new post right away, so a failed submit does not create a second copy
      setV((x) => ({ ...x, id: saved.id, slug: saved.slug, status: saved.status }));
      if (!v.id) window.history.replaceState(null, "", `/app/posts/${saved.id}`);
      let status = saved.status;
      if (then === "submit") {
        const r = await api<{ post: { status: EditablePost["status"] } }>(`/news/${saved.id}/submit`, { method: "POST" });
        status = r.post.status;
      }
      setV((x) => ({ ...x, status }));
      setMsg({
        ok: true,
        text:
          then === "submit"
            ? "Submitted. The admins got an email; you will get one when it is reviewed."
            : status === "published"
              ? "Saved. The post is live."
              : "Draft saved.",
      });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof ApiError || e instanceof Error ? e.message : "Something went wrong." });
    } finally {
      setBusy(null);
    }
  }

  async function withdraw() {
    setBusy("withdraw");
    try {
      await api(`/news/${v.id}/withdraw`, { method: "POST" });
      setV({ ...v, status: "draft" });
      setMsg({ ok: true, text: "Withdrawn. It is a draft again." });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!v.id || !confirm(`Delete "${v.title || "this post"}"? This cannot be undone.`)) return;
    try {
      await api(`/news/${v.id}`, { method: "DELETE" });
      router.push(admin ? "/admin/posts" : "/app/posts");
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    }
  }

  async function addImage(file: File | undefined, to: "body" | "cover") {
    if (!file) return;
    setBusy("image");
    setMsg(null);
    try {
      const url = await uploadImage(file);
      if (to === "cover") setV((x) => ({ ...x, cover: url }));
      else wrap("![", `](${url})`, file.name.replace(/\.[a-z0-9]+$/i, "") || "image");
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(null);
    }
  }

  const needsSources = NEEDS_SOURCES.includes(v.kind);
  const toolsOff = locked || tab === "preview";

  return (
    <form
      className="grid gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="tag" style={{ "--c": v.status === "published" ? "var(--color-lime)" : v.status === "rejected" ? "var(--color-red)" : v.status === "submitted" ? "var(--color-yellow)" : "var(--color-card)" } as React.CSSProperties}>
          {STATUS_TEXT[v.status]}
        </span>
        {v.slug && (
          <Link href={`/news/${v.slug}`} className="btn btn-xs" target="_blank">
            <Eye size={12} aria-hidden /> {v.status === "published" ? "View live" : "Preview page"}
          </Link>
        )}
      </div>

      {v.status === "rejected" && v.reviewNote && (
        <p className="note whitespace-pre-line">
          <b>Admin note</b>
          <span>{v.reviewNote}</span>
        </p>
      )}
      {locked && (
        <p className="note">
          <b>Live</b>
          <span>This post is published, so it can no longer be edited here. Ask an admin if something needs fixing.</span>
        </p>
      )}

      <fieldset className="grid gap-2" disabled={locked}>
        <legend className="label mb-2">What are you writing?</legend>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {kinds.map((k) => (
            <label
              key={k}
              className="card flex cursor-pointer gap-3 p-3 text-sm shadow-[3px_3px_0_var(--color-ink)]! has-[:checked]:bg-[color-mix(in_srgb,var(--c)_28%,var(--color-card))]"
              style={{ "--c": NEWS_KIND[k].c } as React.CSSProperties}
            >
              <input type="radio" name="kind" value={k} checked={v.kind === k} onChange={set("kind")} className="mt-1 accent-ink" />
              <span className="grid gap-0.5">
                <b>{NEWS_KIND[k].label}</b>
                <span className="text-xs text-ink-2">{NEWS_KIND[k].hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-4" disabled={locked}>
        <label className="label">
          Title
          <input className="field" value={v.title} onChange={set("title")} required maxLength={200} placeholder="e.g. How HTLCs make atomic swaps atomic" />
        </label>
        <label className="label">
          Summary <span className="hint">one or two sentences for the card on the home page · {v.summary.length}/400</span>
          <textarea className="field min-h-0!" rows={2} value={v.summary} onChange={set("summary")} required maxLength={400} />
        </label>

        <div className="grid gap-2">
          <span className="label">
            Cover image <span className="hint">optional · shown on the card and at the top of the post · PNG, JPEG, WebP or GIF, at most 4 MB</span>
          </span>
          <div className="flex flex-wrap items-center gap-3">
            {v.cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={v.cover} alt="" className="h-20 w-36 rounded-[10px] border-2 border-ink object-cover" />
            )}
            <button type="button" className="btn btn-sm" onClick={() => coverInput.current?.click()} disabled={busy === "image"}>
              <ImagePlus size={15} aria-hidden /> {v.cover ? "Change" : "Upload"}
            </button>
            {v.cover && (
              <button type="button" className="btn btn-sm" onClick={() => setV({ ...v, cover: "" })}>
                Remove
              </button>
            )}
            <input ref={coverInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => addImage(e.target.files?.[0], "cover").finally(() => (e.target.value = ""))} />
          </div>
        </div>

        <div className="grid gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="label">
              Post <span className="hint">Markdown: ## heading, **bold**, [link](https://…), - list, ```code```</span>
            </span>
            <div className="flex gap-1" role="tablist" aria-label="Editor mode">
              {(["write", "preview"] as const).map((t) => (
                <button key={t} type="button" role="tab" aria-selected={tab === t} className={`chip py-1! text-xs! ${tab === t ? "bg-yellow!" : ""}`} onClick={() => setTab(t)}>
                  {t === "write" ? "Write" : "Preview"}
                </button>
              ))}
            </div>
          </div>
          <div className="md-tools">
            <Tool label="Heading" icon={<Heading2 size={14} />} disabled={toolsOff} onClick={() => linePrefix("## ")} />
            <Tool label="Bold" icon={<Bold size={14} />} disabled={toolsOff} onClick={() => wrap("**", "**", "bold text")} />
            <Tool label="Italic" icon={<Italic size={14} />} disabled={toolsOff} onClick={() => wrap("_", "_", "italic text")} />
            <Tool label="Link" icon={<Link2 size={14} />} disabled={toolsOff} onClick={() => wrap("[", "](https://)", "link text")} />
            <Tool label="Quote" icon={<Quote size={14} />} disabled={toolsOff} onClick={() => linePrefix("> ")} />
            <Tool label="List" icon={<List size={14} />} disabled={toolsOff} onClick={() => linePrefix("- ")} />
            <Tool label="Code" icon={<Code size={14} />} disabled={toolsOff} onClick={() => wrap("\n```\n", "\n```\n", "code")} />
            <Tool label="Insert image" icon={<ImagePlus size={14} />} disabled={toolsOff} onClick={() => imageInput.current?.click()} />
            <input ref={imageInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => addImage(e.target.files?.[0], "body").finally(() => (e.target.value = ""))} />
            {busy === "image" && <span className="mono self-center text-xs">Uploading…</span>}
          </div>
          {tab === "write" ? (
            <textarea
              ref={area}
              className="field md-area"
              value={v.body}
              onChange={set("body")}
              maxLength={40000}
              placeholder={"## Why this matters\n\nWrite in your own words. Quote only short passages and credit figures you reuse.\n\n## How it works\n\n…"}
              onPaste={(e) => {
                const file = [...e.clipboardData.files].find((f) => f.type.startsWith("image/"));
                if (file) {
                  e.preventDefault();
                  addImage(file, "body");
                }
              }}
            />
          ) : (
            <div className="card min-h-[420px] p-6">{v.body.trim() ? <Markdown source={v.body} /> : <p className="text-muted">Nothing to preview yet.</p>}</div>
          )}
          <p className="mono text-xs text-muted">
            {v.body.split(/\s+/).filter(Boolean).length} words · paste or upload images, they are stored on the lab&apos;s server
          </p>
        </div>

        <label className="label">
          Sources {needsSources ? <span className="hint">required for this kind: the paper, the protocol docs, reports about the incident</span> : <span className="hint">optional</span>}
          <textarea
            className="field min-h-0!"
            rows={3}
            value={v.sources}
            onChange={set("sources")}
            maxLength={4000}
            placeholder={"- Nakamoto, S. Bitcoin: A Peer-to-Peer Electronic Cash System (2008). https://bitcoin.org/bitcoin.pdf"}
          />
        </label>
        <p className="note">
          <b>Copyright</b>
          <span>
            Summarise in your own words and link to what you read. Do not paste whole articles or figures you did not make without credit; the admin
            sends such posts back.
          </span>
        </p>

        <label className="label">
          Link <span className="hint">optional, e.g. the paper&apos;s DOI or your code; shown as a button at the end</span>
          <input className="field field-sm" type="url" value={v.link} onChange={set("link")} maxLength={2000} placeholder="https://…" />
        </label>

        {admin && (
          <label className="label max-w-xs">
            Date <span className="hint">shown on the post; a future date waits until that day</span>
            <input className="field field-sm" type="date" value={v.publishedOn} onChange={set("publishedOn")} required />
          </label>
        )}
      </fieldset>

      {msg && <p className={msg.ok ? "success" : "error"}>{msg.text}</p>}

      <div className="flex flex-wrap gap-2">
        {!locked && (
          <button type="submit" className="btn btn-sm" disabled={!!busy}>
            {busy === "save" ? "Saving…" : v.status === "published" ? "Save changes" : "Save draft"}
          </button>
        )}
        {!admin && (v.status === "draft" || v.status === "rejected") && (
          <button type="button" className="btn btn-ink btn-sm" disabled={!!busy} onClick={() => save("submit")}>
            <Send size={15} aria-hidden /> {busy === "submit" ? "Submitting…" : "Submit for review"}
          </button>
        )}
        {!admin && v.status === "submitted" && (
          <button type="button" className="btn btn-sm" disabled={!!busy} onClick={withdraw}>
            <Undo2 size={15} aria-hidden /> Withdraw to keep editing
          </button>
        )}
        {admin && v.status !== "published" && (
          <button type="button" className="btn btn-ink btn-sm" disabled={!!busy} onClick={() => save("publish")}>
            <Send size={15} aria-hidden /> {busy === "publish" ? "Publishing…" : "Publish"}
          </button>
        )}
        {admin && v.status === "published" && (
          <button type="button" className="btn btn-sm" disabled={!!busy} onClick={() => save("draft")}>
            Unpublish
          </button>
        )}
        {v.id && (admin || v.status !== "published") && (
          <button type="button" className="btn btn-sm ml-auto" onClick={remove}>
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
