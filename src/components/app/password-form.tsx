"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api/client";

export function PasswordForm({ first }: { first: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get("newPassword") !== f.get("confirm")) return setError("The two new passwords do not match.");
    setBusy(true);
    setError("");
    try {
      await api("/auth/change-password", { body: { currentPassword: f.get("currentPassword"), newPassword: f.get("newPassword") } });
      router.replace("/app");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form className="grid gap-3" onSubmit={submit}>
      <label className="label">
        {first ? "Temporary password" : "Current password"}
        <input className="field" name="currentPassword" type="password" autoComplete="current-password" required />
      </label>
      <label className="label">
        New password <span className="hint">at least 10 characters</span>
        <input className="field" name="newPassword" type="password" autoComplete="new-password" minLength={10} required />
      </label>
      <label className="label">
        Repeat new password
        <input className="field" name="confirm" type="password" autoComplete="new-password" minLength={10} required />
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-ink mt-2 justify-center" disabled={busy}>
        {busy ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}
