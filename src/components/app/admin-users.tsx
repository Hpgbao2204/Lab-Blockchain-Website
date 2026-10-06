"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Copy, KeyRound, Trash2, UserPlus } from "lucide-react";
import { api } from "@/lib/api/client";
import { Initials } from "./initials";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  title: string | null;
  role: "admin" | "member";
  active: boolean;
  mustChangePassword: boolean;
}

interface EmailResult {
  sent: number;
  saved: number;
  error?: string;
}
interface SecretData {
  email: string;
  password: string;
  mail: EmailResult | null;
}

/** Whether the login details reached the person's inbox, in words the admin can act on. */
function mailLine(email: string, mail: EmailResult | null) {
  if (!mail) return <>Share these details with <b>{email}</b>.</>;
  if (mail.sent) return <>Login details emailed to <b>{email}</b>. You can also copy them below.</>;
  if (mail.saved) return <>Email is not set up here, so it was saved to <code>.data/outbox</code>. Share these details with <b>{email}</b>.</>;
  return <>The email could not be sent ({mail.error}). Share these details with <b>{email}</b> yourself.</>;
}

function Secret({ email, password, mail, onClose }: SecretData & { onClose: () => void }) {
  const text = `Blockchainist members area\nEmail: ${email}\nTemporary password: ${password}\nSign in, then choose your own password.`;
  return (
    <div className="success grid gap-2" role="status">
      <p>
        {mailLine(email, mail)} The temporary password is shown only once.
      </p>
      <code className="code">{text}</code>
      <div className="flex gap-2">
        <button type="button" className="btn btn-sm" onClick={() => navigator.clipboard?.writeText(text)}>
          <Copy size={15} aria-hidden /> Copy
        </button>
        <button type="button" className="btn btn-sm" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}

export function AdminUsers({ users, me, prefill }: { users: AdminUser[]; me: string; prefill?: { name: string; email: string } }) {
  const router = useRouter();
  const [secret, setSecret] = useState<SecretData | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<unknown>) {
    setError("");
    setBusy(true);
    try {
      await fn();
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5">
      <form
        className="card grid gap-3 p-4 md:grid-cols-[1fr_1fr_1fr_auto_auto] md:items-end"
        style={{ boxShadow: "var(--shadow)" }}
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const f = new FormData(form);
          run(async () => {
            const res = await api<{ user: AdminUser; temporaryPassword: string; email: EmailResult | null }>("/admin/users", {
              body: { name: f.get("name"), email: f.get("email"), title: f.get("title"), role: f.get("role"), notify: f.get("notify") === "on" },
            });
            setSecret({ email: res.user.email, password: res.temporaryPassword, mail: res.email });
            form.reset();
          });
        }}
      >
        <label className="label">
          Full name
          <input className="field field-sm" name="name" required maxLength={120} defaultValue={prefill?.name} />
        </label>
        <label className="label">
          Email
          <input className="field field-sm" name="email" type="email" required defaultValue={prefill?.email} />
        </label>
        <label className="label">
          Title <span className="hint">optional</span>
          <input className="field field-sm" name="title" maxLength={160} placeholder="e.g. Undergraduate researcher" />
        </label>
        <label className="label">
          Role
          <select className="field field-sm" name="role" defaultValue="member">
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button className="btn btn-ink btn-sm" type="submit" disabled={busy}>
          <UserPlus size={15} aria-hidden /> Create account
        </button>
        <label className="flex items-center gap-2 text-sm font-bold md:col-span-5">
          <input type="checkbox" name="notify" className="accent-ink" defaultChecked />
          Email the username and temporary password to this address (Vietnamese welcome email)
        </label>
      </form>

      {secret && <Secret {...secret} onClose={() => setSecret(null)} />}
      {error && <p className="error">{error}</p>}

      <div className="card overflow-x-auto p-2" style={{ boxShadow: "var(--shadow)" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Person</th>
              <th>Role</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ opacity: u.active ? 1 : 0.55 }}>
                <td>
                  <div className="flex items-center gap-2">
                    <Initials name={u.name} />
                    <div>
                      <b>{u.name}</b>
                      <div className="mono text-xs text-muted">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <select
                    className="field field-sm w-auto!"
                    value={u.role}
                    disabled={u.id === me || busy}
                    aria-label={`Role of ${u.name}`}
                    onChange={(e) => run(() => api(`/admin/users/${u.id}`, { method: "PATCH", body: { role: e.target.value } }))}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="mono text-xs">{!u.active ? "deactivated" : u.mustChangePassword ? "awaiting first sign-in" : "active"}</td>
                <td>
                  <div className="flex justify-end gap-2">
                    <a href={`/account/profile?user=${u.id}`} className="btn btn-sm">
                      Profile
                    </a>
                    <button
                      type="button"
                      className="btn btn-sm"
                      disabled={busy}
                      onClick={() =>
                        confirm(`Reset the password of ${u.name}? They will be signed out and get the new temporary password by email.`) &&
                        run(async () => {
                          const res = await api<{ temporaryPassword: string; email: EmailResult | null }>(`/admin/users/${u.id}/reset-password`, { body: { notify: true } });
                          setSecret({ email: u.email, password: res.temporaryPassword, mail: res.email });
                        })
                      }
                    >
                      <KeyRound size={14} aria-hidden /> Reset
                    </button>
                    {u.id !== me && (
                      <button type="button" className="btn btn-sm" disabled={busy} onClick={() => run(() => api(`/admin/users/${u.id}`, { method: "PATCH", body: { active: !u.active } }))}>
                        {u.active ? "Deactivate" : "Reactivate"}
                      </button>
                    )}
                    {u.id !== me && (
                      <button
                        type="button"
                        className="btn btn-sm"
                        disabled={busy}
                        aria-label={`Delete the account of ${u.name}`}
                        onClick={() =>
                          confirm(
                            `Delete the account of ${u.name} (${u.email}) for good?\n\nThey leave every group, and their wall posts, comments and profile page are removed. Tasks and files they made stay. This cannot be undone; Deactivate keeps everything instead.`,
                          ) && run(() => api(`/admin/users/${u.id}`, { method: "DELETE" }))
                        }
                      >
                        <Trash2 size={14} aria-hidden /> Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
