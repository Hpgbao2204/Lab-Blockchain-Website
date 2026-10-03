"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mail, Trash2 } from "lucide-react";
import { api } from "@/lib/api/client";

export interface AdminApplication {
  id: string;
  name: string;
  email: string;
  program: string;
  studentId: string | null;
  interests: string[];
  message: string;
  link: string | null;
  status: "new" | "contacted" | "accepted" | "declined";
  adminNote: string | null;
  sent: string;
}

const STATUS: Record<AdminApplication["status"], { label: string; c: string }> = {
  new: { label: "New", c: "var(--color-yellow)" },
  contacted: { label: "Contacted", c: "var(--color-blue)" },
  accepted: { label: "Accepted", c: "var(--color-lime)" },
  declined: { label: "Declined", c: "var(--color-card)" },
};

export function ApplicationCard({ a, areaTitles }: { a: AdminApplication; areaTitles: Record<string, string> }) {
  const router = useRouter();
  const [note, setNote] = useState(a.adminNote ?? "");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const save = async (patch: { status?: AdminApplication["status"]; adminNote?: string }) => {
    setMsg(null);
    try {
      await api(`/applications/${a.id}`, { method: "PATCH", body: patch });
      setMsg({ ok: true, text: "Saved." });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    }
  };
  const reply = `mailto:${a.email}?subject=${encodeURIComponent("Your application to Blockchainist")}`;

  return (
    <article className="card grid gap-3 p-4" style={{ "--c": STATUS[a.status].c } as React.CSSProperties}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-bold">{a.name}</h3>
          <p className="mono text-xs text-muted">
            {a.program}
            {a.studentId ? ` · ${a.studentId}` : ""} · {a.sent}
          </p>
        </div>
        <span className="tag">{STATUS[a.status].label}</span>
      </header>
      <p className="text-sm">
        <a href={reply} className="font-bold underline underline-offset-4">
          {a.email}
        </a>
        {a.link && (
          <>
            {" · "}
            <a href={a.link} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
              link ↗
            </a>
          </>
        )}
      </p>
      {a.interests.length > 0 && (
        <ul className="chips">
          {a.interests.map((i) => (
            <li key={i}>{areaTitles[i] ?? i}</li>
          ))}
        </ul>
      )}
      <p className="whitespace-pre-line text-sm text-ink-2">{a.message}</p>
      <label className="label">
        Private note <span className="hint">only admins see it</span>
        <textarea className="field field-sm min-h-16" value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => note !== (a.adminNote ?? "") && save({ adminNote: note })} maxLength={2000} />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <label className="label flex! items-center gap-2">
          Status
          <select className="field field-sm w-auto!" value={a.status} onChange={(e) => save({ status: e.target.value as AdminApplication["status"] })}>
            {Object.entries(STATUS).map(([k, s]) => (
              <option key={k} value={k}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <a href={reply} className="btn btn-xs">
          <Mail size={12} aria-hidden /> Reply by email
        </a>
        <button
          type="button"
          className="btn btn-xs"
          onClick={async () => {
            if (!confirm(`Delete the application from ${a.name}? This cannot be undone.`)) return;
            try {
              await api(`/applications/${a.id}`, { method: "DELETE" });
              router.refresh();
            } catch (e) {
              setMsg({ ok: false, text: (e as Error).message });
            }
          }}
        >
          <Trash2 size={12} aria-hidden /> Delete
        </button>
      </div>
      {msg && <p className={msg.ok ? "success" : "error"}>{msg.text}</p>}
    </article>
  );
}
