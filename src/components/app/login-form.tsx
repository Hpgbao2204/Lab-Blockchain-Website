"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api/client";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const me = await api<{ mustChangePassword: boolean }>("/auth/login", { body: { email: f.get("email"), password: f.get("password") } });
      router.replace(me.mustChangePassword ? "/account/password" : "/app");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form className="grid gap-3" onSubmit={submit}>
      <label className="label">
        Email
        <input className="field" name="email" type="email" autoComplete="email" required />
      </label>
      <label className="label">
        Password
        <input className="field" name="password" type="password" autoComplete="current-password" required />
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-ink mt-2 justify-center" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
