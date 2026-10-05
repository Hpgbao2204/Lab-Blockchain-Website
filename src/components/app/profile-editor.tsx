"use client";

import { useState } from "react";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { ProfileView } from "@/components/people/profile-view";
import type { CvEntry, CvSections } from "@/server/db/schema";
import type { PersonView } from "@/server/services/people";

export interface EditableProfile {
  slug: string;
  headline: string | null;
  bio: string | null;
  photoUrl: string | null;
  portfolioUrl: string | null;
  links: { label: string; url: string }[];
  interests: string[];
  cv: CvSections;
  display: "template" | "portfolio" | "redirect";
  template: string;
  accent: string;
  published: boolean;
}

const ACCENTS = ["yellow", "blue", "teal", "red", "violet", "orange", "pink", "lime"];
const DISPLAYS: { v: EditableProfile["display"]; title: string; text: string }[] = [
  { v: "template", title: "A CV page on this site", text: "built from the sections below, in the template and colour you pick." },
  { v: "portfolio", title: "My own website, shown here", text: "your site opens full screen at this address under a slim lab bar. Sites that refuse to be shown inside another page (Notion, LinkedIn…) are opened directly instead." },
  { v: "redirect", title: "Go straight to my website", text: "this address forwards visitors to your site." },
];
const TEMPLATES = [
  { v: "classic", t: "Classic · sidebar + timeline" },
  { v: "minimal", t: "Minimal · one column" },
  { v: "spotlight", t: "Spotlight · colour cover" },
  { v: "cards", t: "Cards · a card per section" },
];
const SECTIONS: { key: keyof CvSections; title: string; hint: string }[] = [
  { key: "education", title: "Education", hint: "Degree, school, years" },
  { key: "experience", title: "Research & experience", hint: "Lab work, internships, teaching" },
  { key: "projects", title: "Projects", hint: "Papers, tools, repos, with a link" },
  { key: "awards", title: "Awards", hint: "Scholarships, competitions, best paper" },
];
const LINK_SUGGESTIONS = ["GitHub", "Google Scholar", "ORCID", "LinkedIn", "Email"];

/** Mirrors the GitHub-avatar fallback the public page uses, so the preview matches. */
function photoOf(p: EditableProfile) {
  if (p.photoUrl) return p.photoUrl;
  for (const l of p.links) {
    const m = /^https?:\/\/(?:www\.)?github\.com\/([A-Za-z0-9-]{1,39})\/?$/.exec(l.url);
    if (m) return `https://github.com/${m[1]}.png?size=400`;
  }
  return null;
}

export function ProfileEditor({ userId, name, initial, saved, forAdmin }: { userId: string; name: string; initial: EditableProfile; saved: boolean; forAdmin: boolean }) {
  const [p, setP] = useState(initial);
  const ownSite = p.display !== "template";
  const [interests, setInterests] = useState(initial.interests.join(", "));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [isSaved, setIsSaved] = useState(saved && initial.published);
  const set = <K extends keyof EditableProfile>(k: K, v: EditableProfile[K]) => setP((x) => ({ ...x, [k]: v }));
  const text = (k: "headline" | "bio" | "photoUrl" | "portfolioUrl" | "slug") => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k, e.target.value);
  const interestList = interests
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const setEntry = (k: keyof CvSections, i: number, patch: Partial<CvEntry>) => set("cv", { ...p.cv, [k]: p.cv[k].map((e, j) => (j === i ? { ...e, ...patch } : e)) });
  const preview: PersonView = {
    slug: p.slug,
    name,
    role: "member",
    headline: p.headline || null,
    bio: p.bio || null,
    photo: photoOf(p),
    interests: interestList,
    links: p.links.filter((l) => l.label && l.url),
    portfolioUrl: p.portfolioUrl || null,
    display: p.display,
    template: p.template,
    accent: p.accent,
    cv: { ...p.cv, ...Object.fromEntries(SECTIONS.map((s) => [s.key, p.cv[s.key].filter((e) => e.title)])) } as CvSections,
    areas: [],
    sample: false,
    hasPage: true,
  };

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const body = {
        ...p,
        interests: interestList,
        links: p.links.filter((l) => l.label || l.url),
        cv: preview.cv,
      };
      await api(`/profiles/${userId}`, { method: "PUT", body });
      setIsSaved(p.published);
      setMsg({ ok: true, text: p.published ? "Saved. The profile is public on /people." : "Saved as a draft. Tick “Show on the People page” to make it public." });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,560px)_minmax(0,1fr)]">
      <form
        className="card grid gap-5 p-5"
        style={{ boxShadow: "var(--shadow)" }}
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <fieldset className="grid gap-2">
          <legend className="label mb-1">What opens at /people/{p.slug || "your-name"}?</legend>
          {DISPLAYS.map((d) => (
            <label key={d.v} className="flex items-start gap-2 text-sm">
              <input type="radio" name="display" className="mt-1 accent-ink" checked={p.display === d.v} onChange={() => set("display", d.v)} />
              <span>
                <b>{d.title}</b>: {d.text}
              </span>
            </label>
          ))}
        </fieldset>

        <label className="label">
          Your website {ownSite ? <span className="hint">GitHub Pages, Vercel, Netlify, your own domain…</span> : <span className="hint">optional, shown as a button on your CV</span>}
          <input className="field field-sm" type="url" value={p.portfolioUrl ?? ""} onChange={text("portfolioUrl")} placeholder="https://your-name.github.io/" required={ownSite} />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="label">
            Headline
            <input className="field field-sm" value={p.headline ?? ""} onChange={text("headline")} maxLength={160} placeholder="e.g. Undergraduate researcher" />
          </label>
          <label className="label">
            Page address <span className="hint">/people/…</span>
            <input className="field field-sm" value={p.slug} onChange={text("slug")} required minLength={3} maxLength={60} pattern="[a-z0-9]+(-[a-z0-9]+)*" />
          </label>
        </div>
        <label className="label">
          About <span className="hint">2–4 sentences</span>
          <textarea className="field" value={p.bio ?? ""} onChange={text("bio")} maxLength={2000} />
        </label>
        <label className="label">
          Research interests <span className="hint">comma separated</span>
          <input className="field field-sm" value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="Smart contracts, Zero-knowledge proofs" />
        </label>
        <label className="label">
          Photo link <span className="hint">optional; your GitHub picture is used if you add GitHub below</span>
          <input className="field field-sm" type="url" value={p.photoUrl ?? ""} onChange={text("photoUrl")} placeholder="https://…/me.jpg" />
        </label>

        <fieldset className="grid gap-2">
          <legend className="label mb-1">Links</legend>
          {p.links.map((l, i) => (
            <div key={i} className="grid grid-cols-[120px_minmax(0,1fr)_auto] gap-2">
              <input
                className="field field-sm"
                aria-label="Link label"
                list="link-labels"
                value={l.label}
                maxLength={40}
                onChange={(e) => set("links", p.links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
              />
              <input className="field field-sm" aria-label="Link URL" type="url" value={l.url} onChange={(e) => set("links", p.links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
              <button type="button" className="btn btn-xs" aria-label="Remove link" onClick={() => set("links", p.links.filter((_, j) => j !== i))}>
                <Trash2 size={12} aria-hidden />
              </button>
            </div>
          ))}
          <datalist id="link-labels">
            {LINK_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          {p.links.length < 8 && (
            <button type="button" className="btn btn-xs w-fit" onClick={() => set("links", [...p.links, { label: LINK_SUGGESTIONS[p.links.length % LINK_SUGGESTIONS.length], url: "" }])}>
              <Plus size={12} aria-hidden /> Add link
            </button>
          )}
        </fieldset>

        {SECTIONS.map((s) => (
          <fieldset key={s.key} className="grid gap-2">
            <legend className="label mb-1">
              {s.title} <span className="hint">{s.hint}</span>
            </legend>
            {p.cv[s.key].map((e, i) => (
              <div key={i} className="grid gap-2 rounded-xl border-2 border-dashed border-ink p-3 sm:grid-cols-2">
                <input className="field field-sm" aria-label={`${s.title} title`} placeholder="Title" value={e.title} onChange={(ev) => setEntry(s.key, i, { title: ev.target.value })} maxLength={200} />
                <input className="field field-sm" aria-label={`${s.title} organisation`} placeholder="Where (school, lab, venue)" value={e.org ?? ""} onChange={(ev) => setEntry(s.key, i, { org: ev.target.value })} maxLength={200} />
                <input className="field field-sm" aria-label={`${s.title} period`} placeholder="When, e.g. 2024 – now" value={e.period ?? ""} onChange={(ev) => setEntry(s.key, i, { period: ev.target.value })} maxLength={60} />
                <input className="field field-sm" aria-label={`${s.title} link`} type="url" placeholder="Link (optional)" value={e.url ?? ""} onChange={(ev) => setEntry(s.key, i, { url: ev.target.value })} />
                <textarea className="field sm:col-span-2" aria-label={`${s.title} details`} placeholder="Details (optional)" value={e.detail ?? ""} onChange={(ev) => setEntry(s.key, i, { detail: ev.target.value })} maxLength={1000} style={{ minHeight: 60 }} />
                <button type="button" className="btn btn-xs w-fit" onClick={() => set("cv", { ...p.cv, [s.key]: p.cv[s.key].filter((_, j) => j !== i) })}>
                  <Trash2 size={12} aria-hidden /> Remove
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-xs w-fit" onClick={() => set("cv", { ...p.cv, [s.key]: [...p.cv[s.key], { title: "", org: "", period: "", url: "", detail: "" }] })}>
              <Plus size={12} aria-hidden /> Add
            </button>
          </fieldset>
        ))}

        <fieldset className="grid gap-2">
          <legend className="label mb-1">
            Template and colour {ownSite && <span className="hint">used if you switch back to the CV page, and for your card on /people</span>}
          </legend>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((o) => (
              <button key={o.v} type="button" className="chip" aria-pressed={p.template === o.v} style={{ "--c": "var(--color-yellow)" } as React.CSSProperties} onClick={() => set("template", o.v)}>
                {o.t}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Accent colour">
            {ACCENTS.map((a) => (
              <button
                key={a}
                type="button"
                role="radio"
                aria-checked={p.accent === a}
                aria-label={a}
                onClick={() => set("accent", a)}
                className="h-8 w-8 rounded-lg border-2 border-ink"
                style={{ background: `var(--color-${a})`, boxShadow: p.accent === a ? "3px 3px 0 var(--color-ink)" : "none", transform: p.accent === a ? "translateY(-2px)" : undefined }}
              />
            ))}
          </div>
        </fieldset>

        <label className="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" className="accent-ink" checked={p.published} onChange={(e) => set("published", e.target.checked)} />
          Show on the public People page
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" className="btn btn-ink btn-sm" disabled={busy}>
            {busy ? "Saving…" : "Save profile"}
          </button>
          {isSaved && (
            <a href={`/people/${p.slug}`} target="_blank" className="btn btn-sm">
              View public page <ExternalLink size={13} aria-hidden />
            </a>
          )}
        </div>
        {msg && <p className={msg.ok ? "success" : "error"}>{msg.text}</p>}
        {forAdmin && <p className="mono text-xs text-muted">You are editing {name}&apos;s profile as admin.</p>}
      </form>

      <section aria-label="Live preview" className="grid gap-3 xl:sticky xl:top-24">
        {ownSite && p.portfolioUrl && /^https?:\/\/\S+$/.test(p.portfolioUrl) ? (
          <>
            <p className="mono text-xs uppercase tracking-widest text-muted">
              Preview · {p.display === "portfolio" ? `/people/${p.slug} shows your site` : `/people/${p.slug} forwards to your site`}
            </p>
            <div className="card overflow-hidden" style={{ boxShadow: "var(--shadow)" }}>
              <iframe src={p.portfolioUrl} title="Your website" className="block h-[70vh] w-full border-0 bg-white" sandbox="allow-scripts allow-same-origin" />
            </div>
            <p className="text-xs text-muted">If this box stays empty, your site refuses to be shown inside other pages; visitors are then sent to it directly.</p>
          </>
        ) : (
          <>
            <p className="mono text-xs uppercase tracking-widest text-muted">Live preview</p>
            <div className="card overflow-hidden p-5" style={{ background: "var(--color-paper)" }}>
              <ProfileView person={preview} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
