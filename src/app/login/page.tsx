import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { LoginForm } from "@/components/app/login-form";
import { getCurrentUser } from "@/server/auth/current";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

/** `?next=/app/posts/new` returns there after signing in; only paths on this site are accepted. */
const safeNext = (n?: string) => (n && /^\/(?!\/)[\w\-/?=&.%]*$/.test(n) ? n : "/app");

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  const user = await getCurrentUser();
  if (user) redirect(user.mustChangePassword ? "/account/password" : next);

  return (
    <div className="wrap page grid place-items-center">
      <div className="card grid w-full max-w-[440px] gap-5 p-6 sm:p-8">
        <span className="grid h-12 w-12 place-items-center rounded-xl border-2 border-ink bg-yellow" aria-hidden>
          <Lock size={22} />
        </span>
        <div>
          <h1 className="display text-3xl">Members area</h1>
          <p className="mt-2 text-ink-2">Group walls, weekly task boards and your posts for the lab blog. Accounts are created by the lab admin; there is no public sign-up.</p>
        </div>
        <LoginForm next={next} />
        <p className="mono text-xs text-muted">Forgot your password? Ask the admin to reset it.</p>
      </div>
    </div>
  );
}
