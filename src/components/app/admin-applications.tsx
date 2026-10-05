"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, MessageCircle, Phone, Send, Trash2, UserCheck, UserPlus, X } from "lucide-react";
import { api } from "@/lib/api/client";
import { zaloLink } from "@/lib/contact";

type Status = "new" | "contacted" | "accepted" | "declined";

export interface AdminApplication {
  id: string;
  name: string;
  email: string;
  program: string;
  studentId: string | null;
  interests: string[];
  message: string;
  link: string | null;
  facebook: string | null;
  zalo: string | null;
  status: Status;
  adminNote: string | null;
  replies: { at: string; by: string; status: Status; message: string; emailed: boolean }[];
  /** everyone on the application, the contact person first */
  people: { name: string; studentId: string; email: string; phone: string; zalo: string; facebook: string; userId?: string | null; account?: "created" | "existing" }[];
  sent: string;
}

type ReplyResult = {
  emailed: boolean;
  error?: string;
  accounts: { email: string; name: string; account: "created" | "existing" }[];
  loginEmails: { sent: number; of: number; error?: string } | null;
};

const STATUS: Record<Status, { label: string; c: string }> = {
  new: { label: "New", c: "var(--color-yellow)" },
  contacted: { label: "Contacted", c: "var(--color-blue)" },
  accepted: { label: "Accepted", c: "var(--color-lime)" },
  declined: { label: "Declined", c: "var(--color-card)" },
};

type Decision = "accepted" | "declined" | "contacted";
const DECISIONS: { v: Decision; label: string; icon: typeof Check }[] = [
  { v: "accepted", label: "Accept", icon: Check },
  { v: "declined", label: "Decline", icon: X },
  { v: "contacted", label: "Just reply", icon: MessageCircle },
];

/** Starting points in Vietnamese, since applicants are UIT students; the admin edits them freely. */
const DRAFTS: Record<Decision, (name: string) => string> = {
  accepted: () =>
    "Cảm ơn bạn đã quan tâm đến nhóm. Nhóm rất vui được chào đón bạn!\n\nBạn sẽ nhận được một email khác với tài khoản đăng nhập website của nhóm. Hẹn gặp bạn ở buổi họp lab sắp tới.",
  declined: () =>
    "Cảm ơn bạn đã quan tâm và gửi đơn đến nhóm. Hiện tại nhóm chưa thể nhận thêm thành viên phù hợp với hướng bạn đề xuất.\n\nChúc bạn học tập tốt, và hy vọng sẽ có dịp hợp tác trong tương lai.",
  contacted: () => "Cảm ơn bạn đã gửi đơn. ",
};

const stamp = (iso: string) => new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Ho_Chi_Minh", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function ApplicationCard({ a, areaTitles }: { a: AdminApplication; areaTitles: Record<string, string> }) {
  const router = useRouter();
  const [note, setNote] = useState(a.adminNote ?? "");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [makeAccounts, setMakeAccounts] = useState(true);
  const team = a.people.length > 1;
  const withoutAccount = a.people.filter((p) => !p.userId);

  const save = async (patch: { status?: Status; adminNote?: string }) => {
    setMsg(null);
    try {
      await api(`/applications/${a.id}`, { method: "PATCH", body: patch });
      setMsg({ ok: true, text: "Saved." });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    }
  };

  const choose = (d: Decision) => {
    // keep what the admin typed; only swap in a draft while the box is empty or still an untouched draft
    if (!text.trim() || Object.values(DRAFTS).some((f) => f(a.name) === text)) setText(DRAFTS[d](a.name));
    setDecision(d);
  };

  const send = async () => {
    if (!decision) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await api<ReplyResult>(`/applications/${a.id}/reply`, { body: { status: decision, message: text, createAccounts: decision === "accepted" && makeAccounts } });
      const parts = [r.emailed ? `Message sent to ${team ? `all ${a.people.length} people` : a.email}; replies come to your email.` : `Saved, but the message was not emailed: ${r.error}`];
      const created = r.accounts.filter((x) => x.account === "created").length;
      const existing = r.accounts.filter((x) => x.account === "existing").length;
      if (created) parts.push(`${created} account${created === 1 ? "" : "s"} created${r.loginEmails && r.loginEmails.sent === r.loginEmails.of ? ", login details emailed" : `, but the login emails failed (${r.loginEmails?.error ?? "unknown error"}); use Reset on the Accounts page to send new ones`}.`);
      if (existing) parts.push(`${existing} already had an account.`);
      setMsg({ ok: r.emailed && (!r.loginEmails || r.loginEmails.sent === r.loginEmails.of), text: parts.join(" ") });
      setDecision(null);
      setText("");
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const firstWithout = withoutAccount[0];
  const createAccount = firstWithout ? `/admin?${new URLSearchParams({ name: firstWithout.name, email: firstWithout.email })}` : null;

  return (
    <article className="card grid min-w-0 gap-3 p-4 [overflow-wrap:anywhere]" style={{ "--c": STATUS[a.status].c } as React.CSSProperties}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-bold">{a.name}</h3>
          <p className="mono text-xs text-muted">
            {a.program}
            {team ? ` · team of ${a.people.length}` : ""} · {a.sent}
          </p>
        </div>
        <span className="tag">{STATUS[a.status].label}</span>
      </header>
      <ol className="grid gap-2">
        {a.people.map((p, i) => (
          <li key={i} className="grid gap-1 rounded-xl border-2 border-ink bg-card p-3 text-sm">
            <p className="flex flex-wrap items-center gap-x-2 font-bold">
              {team && <span className="mono text-xs text-muted">{i + 1}.</span>}
              {p.name}
              {p.studentId && <span className="mono text-xs font-normal text-muted">{p.studentId}</span>}
              {p.account && (
                <span className="tag ml-auto" style={{ "--c": "var(--color-lime)" } as React.CSSProperties}>
                  <UserCheck size={11} className="inline" aria-hidden /> {p.account === "created" ? "account created" : "had an account"}
                </span>
              )}
            </p>
            <p className="flex flex-wrap gap-x-3 gap-y-1">
              <a href={`mailto:${p.email}`} className="underline underline-offset-4">
                {p.email}
              </a>
              {p.phone && (
                <a href={`tel:${p.phone.replace(/[^0-9+]/g, "")}`} className="underline underline-offset-4">
                  <Phone size={11} className="inline" aria-hidden /> {p.phone}
                </a>
              )}
              {p.zalo && (
                <a href={zaloLink(p.zalo)} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                  Zalo{p.zalo !== p.phone ? ` ${p.zalo}` : ""} ↗
                </a>
              )}
              {p.facebook && (
                <a href={p.facebook} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                  Facebook ↗
                </a>
              )}
            </p>
          </li>
        ))}
      </ol>
      {a.link && (
        <p className="text-sm">
          <a href={a.link} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
            {a.link} ↗
          </a>
        </p>
      )}
      {a.interests.length > 0 && (
        <ul className="chips">
          {a.interests.map((i) => (
            <li key={i}>{areaTitles[i] ?? i}</li>
          ))}
        </ul>
      )}
      <p className="whitespace-pre-line text-sm text-ink-2">{a.message}</p>

      {a.replies.length > 0 && (
        <ol className="grid gap-2" aria-label="Replies sent">
          {a.replies.map((r, i) => (
            <li key={i} className="rounded-xl border-2 border-ink bg-paper p-3 text-sm">
              <p className="mono mb-1 text-xs text-muted">
                {r.by} · {stamp(r.at)} · {STATUS[r.status].label}
                {r.emailed ? " · emailed" : " · not emailed"}
              </p>
              <p className="whitespace-pre-line">{r.message}</p>
            </li>
          ))}
        </ol>
      )}

      <fieldset className="grid gap-2 rounded-xl border-2 border-dashed border-ink p-3">
        <legend className="label px-1">Answer {team ? "the team" : a.name}</legend>
        <div className="flex flex-wrap gap-2">
          {DECISIONS.map((d) => (
            <button key={d.v} type="button" className={`btn btn-xs ${decision === d.v ? "btn-ink" : ""}`} aria-pressed={decision === d.v} onClick={() => choose(d.v)}>
              <d.icon size={12} aria-hidden /> {d.label}
            </button>
          ))}
        </div>
        {decision && (
          <>
            <label className="label">
              Message <span className="hint">emailed to {team ? `all ${a.people.length} people` : a.email}; their replies go to your email</span>
              <textarea className="field field-sm min-h-28" value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} />
            </label>
            {decision === "accepted" && withoutAccount.length > 0 && (
              <label className="flex items-start gap-2 text-sm font-bold">
                <input type="checkbox" className="mt-1 accent-ink" checked={makeAccounts} onChange={(e) => setMakeAccounts(e.target.checked)} />
                <span>
                  Create {withoutAccount.length === 1 ? "an account" : `${withoutAccount.length} accounts`} and email the login details
                  <span className="block font-normal text-muted">Username = their email, a random temporary password, the usual Vietnamese welcome email.</span>
                </span>
              </label>
            )}
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-ink btn-xs" disabled={busy || !text.trim()} onClick={send}>
                <Send size={12} aria-hidden /> {busy ? "Sending…" : `Send${decision === "contacted" ? "" : ` and mark ${STATUS[decision].label.toLowerCase()}`}`}
              </button>
              <button type="button" className="btn btn-xs" onClick={() => setDecision(null)}>
                Later
              </button>
            </div>
          </>
        )}
      </fieldset>

      <label className="label">
        Private note <span className="hint">only admins see it</span>
        <textarea className="field field-sm min-h-16" value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => note !== (a.adminNote ?? "") && save({ adminNote: note })} maxLength={2000} />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <label className="label flex! items-center gap-2">
          Status
          <select className="field field-sm w-auto!" value={a.status} onChange={(e) => save({ status: e.target.value as Status })}>
            {Object.entries(STATUS).map(([k, s]) => (
              <option key={k} value={k}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        {a.status === "accepted" && createAccount && (
          <a href={createAccount} className="btn btn-xs">
            <UserPlus size={12} aria-hidden /> Create their account
          </a>
        )}
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
