"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { api } from "@/lib/api/client";

const PROGRAMS = ["Undergraduate", "Master's", "PhD", "Other"] as const;

/** The public application form; the result lands in the admin's inbox at /admin/applications. */
export function ApplyForm({ areas }: { areas: { slug: string; title: string }[] }) {
  const empty = { name: "", email: "", program: "Undergraduate", studentId: "", message: "", link: "", facebook: "", zalo: "", website: "" };
  const [v, setV] = useState(empty);
  const [interests, setInterests] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setV({ ...v, [k]: e.target.value });

  return (
    <form
      className="card grid gap-4 p-5 sm:p-6 md:grid-cols-2"
      style={{ boxShadow: "var(--shadow)" }}
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMsg(null);
        try {
          await api("/applications", { body: { ...v, interests } });
          setV(empty);
          setInterests([]);
          setMsg({ ok: true, text: "Thank you! Your application reached the lab. We reply by email, usually within a week." });
        } catch (err) {
          setMsg({ ok: false, text: (err as Error).message });
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="label">
        Full name
        <input className="field" value={v.name} onChange={set("name")} required maxLength={120} autoComplete="name" />
      </label>
      <label className="label">
        Email <span className="hint">we reply here</span>
        <input className="field" type="email" value={v.email} onChange={set("email")} required maxLength={200} autoComplete="email" />
      </label>
      <label className="label">
        Program
        <select className="field" value={v.program} onChange={set("program")}>
          {PROGRAMS.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </label>
      <label className="label">
        Student ID <span className="hint">optional</span>
        <input className="field" value={v.studentId} onChange={set("studentId")} maxLength={40} />
      </label>

      <fieldset className="grid gap-2 md:col-span-2">
        <legend className="label mb-1">
          Directions that interest you <span className="hint">optional</span>
        </legend>
        <ul className="flex flex-wrap gap-2">
          {areas.map((a) => {
            const on = interests.includes(a.slug);
            return (
              <li key={a.slug}>
                <label className={`btn btn-xs cursor-pointer ${on ? "btn-yellow" : ""}`}>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={on}
                    onChange={() => setInterests(on ? interests.filter((x) => x !== a.slug) : [...interests, a.slug])}
                  />
                  {a.title}
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <label className="label md:col-span-2">
        About you
        <span className="hint">who you are, what you have built or read, and what you would like to try (at least 30 characters)</span>
        <textarea className="field min-h-36" value={v.message} onChange={set("message")} required minLength={30} maxLength={4000} />
      </label>
      <label className="label">
        Zalo <span className="hint">optional: phone number</span>
        <input className="field" type="tel" value={v.zalo} onChange={set("zalo")} maxLength={20} autoComplete="tel" placeholder="0901 234 567" pattern="\+?[0-9][0-9 .\-]{7,18}" />
      </label>
      <label className="label">
        Facebook <span className="hint">optional: profile link</span>
        <input className="field" type="url" value={v.facebook} onChange={set("facebook")} maxLength={2000} placeholder="https://facebook.com/your.name" />
      </label>
      <label className="label md:col-span-2">
        Link <span className="hint">optional: GitHub, CV or portfolio</span>
        <input className="field" type="url" value={v.link} onChange={set("link")} maxLength={2000} placeholder="https://github.com/…" />
      </label>
      {/* honeypot, hidden from people and screen readers */}
      <input type="text" name="website" value={v.website} onChange={set("website")} tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-px w-px opacity-0" />

      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
        <button className="btn btn-ink" type="submit" disabled={busy}>
          {busy ? "Sending…" : "Send application"} <Send size={16} aria-hidden />
        </button>
        <span className="text-xs text-muted">We only use your details to reply to this application.</span>
      </div>
      {msg && (
        <p className={`${msg.ok ? "success" : "error"} md:col-span-2`} role="status">
          {msg.text}
        </p>
      )}
    </form>
  );
}
