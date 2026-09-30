import type { Metadata } from "next";
import { Lock } from "lucide-react";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="wrap page grid place-items-center">
      <div className="card grid w-full max-w-[440px] gap-5 p-6 sm:p-8">
        <span className="grid h-12 w-12 place-items-center rounded-xl border-2 border-ink bg-yellow" aria-hidden>
          <Lock size={22} />
        </span>
        <div>
          <h1 className="display text-3xl">Members area</h1>
          <p className="mt-2 text-ink-2">Group walls and task boards for lab members. Accounts are created by the admin; there is no public sign-up.</p>
        </div>
        <form className="grid gap-3" aria-describedby="login-note">
          <label className="grid gap-1.5 text-sm font-bold">
            Email
            <input className="field" type="email" autoComplete="email" disabled />
          </label>
          <label className="grid gap-1.5 text-sm font-bold">
            Password
            <input className="field" type="password" autoComplete="current-password" disabled />
          </label>
          <button type="submit" className="btn btn-ink mt-2 justify-center opacity-60" disabled>
            Sign in
          </button>
        </form>
        <p id="login-note" className="note">
          <b>Soon</b>
          <span>Sign-in opens with the next milestone, once the database is connected.</span>
        </p>
      </div>
    </div>
  );
}
