"use client";

import { useCallback, useState } from "react";
import { Send, UserPlus, X } from "lucide-react";
import { api } from "@/lib/api/client";
import { withoutAccents } from "@/lib/text";
import { Turnstile } from "./turnstile";

const PROGRAMS = ["Undergraduate", "Master's", "PhD", "Other"] as const;
const MAX_TEAM = 6;

interface Person {
  name: string;
  studentId: string;
  email: string;
  phone: string;
  zalo: string;
  /** Zalo uses the same number as the phone */
  zaloSame: boolean;
  facebook: string;
}
const blank = (): Person => ({ name: "", studentId: "", email: "", phone: "", zalo: "", zaloSame: true, facebook: "" });

/**
 * The public application form, for one person or a whole team. Every field of every person is
 * required; on acceptance each of them gets an account. The result lands at /admin/applications.
 */
export function ApplyForm({ areas, captchaSiteKey }: { areas: { slug: string; title: string }[]; captchaSiteKey?: string }) {
  const [people, setPeople] = useState<Person[]>([blank()]);
  const [program, setProgram] = useState<string>("Undergraduate");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [website, setWebsite] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [captcha, setCaptcha] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const onCaptcha = useCallback((t: string) => setCaptcha(t), []);

  const setPerson = (i: number, patch: Partial<Person>) => setPeople((ps) => ps.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const resize = (n: number) => setPeople((ps) => (n > ps.length ? [...ps, ...Array.from({ length: n - ps.length }, blank)] : ps.slice(0, n)));
  const team = people.length > 1;

  async function submit() {
    setBusy(true);
    setMsg(null);
    try {
      await api("/applications", {
        body: {
          members: people.map((p) => ({ name: p.name, studentId: p.studentId, email: p.email, phone: p.phone, zalo: p.zaloSame ? p.phone : p.zalo, facebook: p.facebook })),
          program,
          interests,
          message,
          link,
          website,
          captcha: captcha || undefined,
        },
      });
      setPeople([blank()]);
      setMessage("");
      setLink("");
      setInterests([]);
      setMsg({ ok: true, text: `Thank you! Your application reached the lab. We reply by email${team ? " to everyone on the team" : ""}, usually within a week.` });
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setCaptcha("");
      setCaptchaKey((k) => k + 1);
      setBusy(false);
    }
  }

  return (
    <form
      className="card grid gap-5 p-5 sm:p-6"
      style={{ boxShadow: "var(--shadow)" }}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <fieldset className="grid gap-2">
        <legend className="label mb-1">
          How many of you are applying? <span className="hint">a team working together applies once; everyone gets their own account</span>
        </legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Team size">
          {Array.from({ length: MAX_TEAM }, (_, i) => i + 1).map((n) => (
            <button key={n} type="button" role="radio" aria-checked={people.length === n} className={`btn btn-xs ${people.length === n ? "btn-ink" : ""}`} onClick={() => resize(n)}>
              {n === 1 ? "Just me" : `${n} people`}
            </button>
          ))}
        </div>
      </fieldset>

      {people.map((p, i) => {
        const ascii = withoutAccents(p.name);
        return (
          <fieldset key={i} className="grid gap-3 rounded-xl border-2 border-dashed border-ink p-4 md:grid-cols-2">
            <legend className="label flex items-center gap-2 px-1">
              {team ? (i === 0 ? "Person 1 · contact person" : `Person ${i + 1}`) : "Your details"}
              {i > 0 && (
                <button type="button" className="btn btn-xs" aria-label={`Remove person ${i + 1}`} onClick={() => setPeople((ps) => ps.filter((_, j) => j !== i))}>
                  <X size={12} aria-hidden />
                </button>
              )}
            </legend>
            <label className="label">
              Full name <span className="hint">{p.name && ascii !== p.name.trim() ? `saved as “${ascii}”` : "Vietnamese without accents, e.g. Nguyen Van An"}</span>
              <input className="field" value={p.name} onChange={(e) => setPerson(i, { name: e.target.value })} required maxLength={120} autoComplete={i === 0 ? "name" : "off"} />
            </label>
            <label className="label">
              Student ID
              <input className="field" value={p.studentId} onChange={(e) => setPerson(i, { studentId: e.target.value })} required minLength={4} maxLength={20} pattern="[A-Za-z0-9]+" inputMode="numeric" placeholder="22520001" />
            </label>
            <label className="label">
              Email <span className="hint">becomes the username; the login is sent here</span>
              <input className="field" type="email" value={p.email} onChange={(e) => setPerson(i, { email: e.target.value })} required maxLength={200} autoComplete={i === 0 ? "email" : "off"} placeholder="22520001@gm.uit.edu.vn" />
            </label>
            <label className="label">
              Phone
              <input className="field" type="tel" value={p.phone} onChange={(e) => setPerson(i, { phone: e.target.value })} required maxLength={20} pattern="\+?[0-9][0-9 .\-]{7,18}" autoComplete={i === 0 ? "tel" : "off"} placeholder="0901 234 567" />
            </label>
            <div className="grid content-start gap-2">
              <label className="flex items-center gap-2 text-sm font-bold">
                <input type="checkbox" className="accent-ink" checked={p.zaloSame} onChange={(e) => setPerson(i, { zaloSame: e.target.checked })} />
                Zalo uses this phone number
              </label>
              {!p.zaloSame && (
                <label className="label">
                  Zalo number
                  <input className="field" type="tel" value={p.zalo} onChange={(e) => setPerson(i, { zalo: e.target.value })} required maxLength={20} pattern="\+?[0-9][0-9 .\-]{7,18}" placeholder="0901 234 567" />
                </label>
              )}
            </div>
            <label className="label">
              Facebook <span className="hint">profile link</span>
              <input className="field" value={p.facebook} onChange={(e) => setPerson(i, { facebook: e.target.value })} required maxLength={2000} placeholder="https://facebook.com/your.name" />
            </label>
          </fieldset>
        );
      })}
      {people.length < MAX_TEAM && (
        <button type="button" className="btn btn-xs w-fit" onClick={() => resize(people.length + 1)}>
          <UserPlus size={13} aria-hidden /> Add a person
        </button>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="label">
          Program
          <select className="field" value={program} onChange={(e) => setProgram(e.target.value)}>
            {PROGRAMS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="label">
          Link <span className="hint">optional: GitHub, CV or portfolio</span>
          <input className="field" type="url" value={link} onChange={(e) => setLink(e.target.value)} maxLength={2000} placeholder="https://github.com/…" />
        </label>
      </div>

      <fieldset className="grid gap-2">
        <legend className="label mb-1">
          Directions that interest you <span className="hint">optional</span>
        </legend>
        <ul className="flex flex-wrap gap-2">
          {areas.map((a) => {
            const on = interests.includes(a.slug);
            return (
              <li key={a.slug}>
                <label className={`btn btn-xs cursor-pointer ${on ? "btn-yellow" : ""}`}>
                  <input type="checkbox" className="sr-only" checked={on} onChange={() => setInterests(on ? interests.filter((x) => x !== a.slug) : [...interests, a.slug])} />
                  {a.title}
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <label className="label">
        About {team ? "your team" : "you"}
        <span className="hint">who you are, what you have built or read, and what you would like to try (at least 30 characters)</span>
        <textarea className="field min-h-36" value={message} onChange={(e) => setMessage(e.target.value)} required minLength={30} maxLength={4000} />
      </label>
      {/* honeypot, hidden from people and screen readers */}
      <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-px w-px opacity-0" />

      {captchaSiteKey && <Turnstile key={captchaKey} siteKey={captchaSiteKey} onToken={onCaptcha} />}

      <div className="flex flex-wrap items-center gap-3">
        <button className="btn btn-ink" type="submit" disabled={busy || (!!captchaSiteKey && !captcha)}>
          {busy ? "Sending…" : team ? `Send application for ${people.length} people` : "Send application"} <Send size={16} aria-hidden />
        </button>
        <span className="text-xs text-muted">We only use these details to handle this application and, if accepted, to create your accounts.</span>
      </div>
      {msg && (
        <p className={msg.ok ? "success" : "error"} role="status">
          {msg.text}
        </p>
      )}
    </form>
  );
}
