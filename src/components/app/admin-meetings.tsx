"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Megaphone, Plus, Send, Trash2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { MeetingCard, type MeetingCardData } from "./meeting-card";

interface Person {
  id: string;
  name: string;
  times: number;
  lastPresented: string | null;
}
export interface AdminMeeting extends MeetingCardData {
  date: string;
  time: string;
}
interface EmailResult {
  recipients: number;
  sent: number;
  saved: number;
  error?: string;
}

/** What happened to the emails, in words the admin can act on. */
function emailNote(e: EmailResult | null): { ok: boolean; text: string } | null {
  if (!e) return null;
  if (e.error) return { ok: false, text: `Saved, but the email failed: ${e.error}` };
  if (e.saved) return { ok: true, text: `Saved. Email is not set up here, so ${e.saved} email${e.saved === 1 ? " was" : "s were"} written to .data/outbox to preview.` };
  return { ok: true, text: `Saved and emailed ${e.sent} member${e.sent === 1 ? "" : "s"}.` };
}

export function NewMeeting({ people, defaultDate }: { people: Person[]; defaultDate: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="grid gap-4">
      <button type="button" className="btn btn-yellow btn-sm w-fit" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <Plus size={15} aria-hidden /> Schedule a meeting
      </button>
      {open && <MeetingForm people={people} initial={{ title: "Lab meeting", date: defaultDate, time: "14:00", location: "", link: "", notes: "", presenters: [] }} onDone={() => setOpen(false)} />}
    </div>
  );
}

interface FormValue {
  title: string;
  date: string;
  time: string;
  location: string;
  link: string;
  notes: string;
  presenters: { userId: string; topic: string }[];
}

function MeetingForm({ people, initial, meetingId, onDone }: { people: Person[]; initial: FormValue; meetingId?: string; onDone: () => void }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const chosen = new Map(v.presenters.map((p) => [p.userId, p.topic]));
  const set = (k: keyof FormValue) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });
  const toggle = (id: string) =>
    setV({ ...v, presenters: chosen.has(id) ? v.presenters.filter((p) => p.userId !== id) : [...v.presenters, { userId: id, topic: "" }] });

  return (
    <form
      className="card grid gap-3 p-4 md:grid-cols-2"
      style={{ boxShadow: "var(--shadow)" }}
      onSubmit={async (e) => {
        e.preventDefault();
        if (notify && !confirm(`Email every member about this meeting?`)) return;
        setBusy(true);
        setMsg(null);
        try {
          const r = await api<{ email: EmailResult | null }>(meetingId ? `/meetings/${meetingId}` : "/meetings", { method: meetingId ? "PATCH" : "POST", body: { ...v, notify } });
          setMsg(emailNote(r.email) ?? { ok: true, text: "Saved." });
          router.refresh();
          if (!r.email?.error) setTimeout(onDone, 1800);
        } catch (err) {
          setMsg({ ok: false, text: (err as Error).message });
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="label md:col-span-2">
        Title
        <input className="field field-sm" value={v.title} onChange={set("title")} required maxLength={200} placeholder="e.g. Weekly seminar" />
      </label>
      <label className="label">
        Date
        <input className="field field-sm" type="date" value={v.date} onChange={set("date")} required />
      </label>
      <label className="label">
        Time <span className="hint">Vietnam time</span>
        <input className="field field-sm" type="time" value={v.time} onChange={set("time")} required />
      </label>
      <label className="label">
        Room <span className="hint">optional</span>
        <input className="field field-sm" value={v.location} onChange={set("location")} maxLength={200} placeholder="e.g. B4.10 or Online" />
      </label>
      <label className="label">
        Online link <span className="hint">optional</span>
        <input className="field field-sm" type="url" value={v.link} onChange={set("link")} maxLength={2000} placeholder="https://meet.google.com/…" />
      </label>

      <fieldset className="grid gap-2 md:col-span-2">
        <legend className="label mb-1">
          Presenters <span className="hint">longest since last presenting first</span>
        </legend>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {people.map((p) => (
            <li key={p.id} className="grid gap-1 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-ink" checked={chosen.has(p.id)} onChange={() => toggle(p.id)} />
                <span className="flex-1">{p.name}</span>
                <span className="mono text-[11px] text-muted">{p.lastPresented ? `last ${p.lastPresented}` : "never"}</span>
              </label>
              {chosen.has(p.id) && (
                <input
                  className="field field-sm"
                  aria-label={`Topic for ${p.name}`}
                  placeholder="Topic (optional)"
                  maxLength={300}
                  value={chosen.get(p.id)}
                  onChange={(e) => setV({ ...v, presenters: v.presenters.map((x) => (x.userId === p.id ? { ...x, topic: e.target.value } : x)) })}
                />
              )}
            </li>
          ))}
        </ul>
      </fieldset>

      <label className="label md:col-span-2">
        Notes <span className="hint">optional, e.g. agenda or paper to read</span>
        <textarea className="field" value={v.notes} onChange={set("notes")} maxLength={3000} />
      </label>
      <label className="flex items-center gap-2 text-sm font-bold md:col-span-2">
        <input type="checkbox" className="accent-ink" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
        {meetingId ? "Email every member about the change" : "Email every member now"}
      </label>
      <div className="flex flex-wrap gap-2 md:col-span-2">
        <button className="btn btn-ink btn-sm" type="submit" disabled={busy}>
          {busy ? "Saving…" : meetingId ? "Save changes" : "Schedule"}
        </button>
        <button className="btn btn-sm" type="button" onClick={onDone}>
          Cancel
        </button>
      </div>
      {msg && <p className={`${msg.ok ? "success" : "error"} md:col-span-2`}>{msg.text}</p>}
    </form>
  );
}

export function AdminMeetingItem({ meeting, people }: { meeting: AdminMeeting; people: Person[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  if (editing)
    return (
      <MeetingForm
        people={people}
        meetingId={meeting.id}
        initial={{
          title: meeting.title,
          date: meeting.date,
          time: meeting.time,
          location: meeting.location ?? "",
          link: meeting.link ?? "",
          notes: meeting.notes ?? "",
          presenters: meeting.presenters.map((p) => ({ userId: p.id, topic: p.topic ?? "" })),
        }}
        onDone={() => setEditing(false)}
      />
    );
  return (
    <MeetingCard meeting={meeting}>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-xs" onClick={() => setEditing(true)}>
          Edit / swap presenter
        </button>
        <button
          type="button"
          className="btn btn-xs"
          onClick={async () => {
            if (!confirm("Email every member about this meeting again?")) return;
            try {
              setMsg(emailNote(await api<EmailResult>(`/meetings/${meeting.id}/notify`, { method: "POST" })));
            } catch (e) {
              setMsg({ ok: false, text: (e as Error).message });
            }
          }}
        >
          <Send size={12} aria-hidden /> Email again
        </button>
        <button
          type="button"
          className="btn btn-xs"
          onClick={async () => {
            if (!confirm(`Delete "${meeting.title}"? Members are not emailed about it.`)) return;
            await api(`/meetings/${meeting.id}`, { method: "DELETE" }).catch((e) => setMsg({ ok: false, text: e.message }));
            router.refresh();
          }}
        >
          <Trash2 size={12} aria-hidden /> Delete
        </button>
      </div>
      {msg && <p className={msg.ok ? "success" : "error"}>{msg.text}</p>}
    </MeetingCard>
  );
}

export function NewAnnouncement() {
  const router = useRouter();
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <form
      className="card grid gap-3 p-4"
      style={{ boxShadow: "var(--shadow)" }}
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const f = new FormData(form);
        if (notify && !confirm("Email this to every member?")) return;
        setBusy(true);
        setMsg(null);
        try {
          const r = await api<{ email: EmailResult | null }>("/announcements", { body: { title: f.get("title"), body: f.get("body"), notify } });
          setMsg(emailNote(r.email) ?? { ok: true, text: "Posted." });
          form.reset();
          router.refresh();
        } catch (err) {
          setMsg({ ok: false, text: (err as Error).message });
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="label">
        Title
        <input className="field field-sm" name="title" required maxLength={200} placeholder="e.g. No meeting next week" />
      </label>
      <label className="label">
        Message
        <textarea className="field" name="body" required maxLength={5000} />
      </label>
      <label className="flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" className="accent-ink" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
        Email every member
      </label>
      <button className="btn btn-ink btn-sm w-fit" type="submit" disabled={busy}>
        <Megaphone size={15} aria-hidden /> {busy ? "Posting…" : "Post to everyone"}
      </button>
      {msg && <p className={msg.ok ? "success" : "error"}>{msg.text}</p>}
    </form>
  );
}

export function DeleteAnnouncement({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn btn-xs"
      aria-label="Delete announcement"
      onClick={async () => {
        if (!confirm("Delete this announcement?")) return;
        await api(`/announcements/${id}`, { method: "DELETE" });
        router.refresh();
      }}
    >
      <Trash2 size={12} aria-hidden />
    </button>
  );
}
