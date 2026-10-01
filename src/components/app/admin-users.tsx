"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Copy, KeyRound, UserPlus } from "lucide-react";
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

function Secret({ email, password, onClose }: { email: string; password: string; onClose: () => void }) {
  const text = `Blockchainist members area\nEmail: ${email}\nTemporary password: ${password}\nSign in, then choose your own password.`;
  return (
    <div className="success grid gap-2" role="status">
      <p>
        Share these details with <b>{email}</b>. The temporary password is shown only once.
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

export function AdminUsers({ users, me }: { users: AdminUser[]; me: string }) {
  const router = useRouter();
  const [secret, setSecret] = useState<{ email: string; password: string } | null>(null);
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
            const res = await api<{ user: AdminUser; temporaryPassword: string }>("/admin/users", {
              body: { name: f.get("name"), email: f.get("email"), title: f.get("title"), role: f.get("role") },
            });
            setSecret({ email: res.user.email, password: res.temporaryPassword });
            form.reset();
          });
        }}
      >
        <label className="label">
          Full name
          <input className="field field-sm" name="name" required maxLength={120} />
        </label>
        <label className="label">
          Email
          <input className="field field-sm" name="email" type="email" required />
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
                        confirm(`Reset the password of ${u.name}? They will be signed out.`) &&
                        run(async () => {
                          const res = await api<{ temporaryPassword: string }>(`/admin/users/${u.id}/reset-password`, { body: {} });
                          setSecret({ email: u.email, password: res.temporaryPassword });
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
