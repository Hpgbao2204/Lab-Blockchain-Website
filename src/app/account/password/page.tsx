import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { PasswordForm } from "@/components/app/password-form";
import { requirePageUser } from "@/server/auth/current";

export const metadata: Metadata = { title: "Change password", robots: { index: false } };

export default async function PasswordPage() {
  const user = await requirePageUser({ allowPasswordChange: true });
  return (
    <div className="wrap page grid place-items-center">
      <div className="card grid w-full max-w-[440px] gap-5 p-6 sm:p-8">
        <span className="grid h-12 w-12 place-items-center rounded-xl border-2 border-ink bg-lime" aria-hidden>
          <KeyRound size={22} />
        </span>
        <div>
          <h1 className="display text-3xl">{user.mustChangePassword ? "Set your password" : "Change password"}</h1>
          <p className="mt-2 text-ink-2">
            {user.mustChangePassword ? `Welcome, ${user.name}. Replace the temporary password from the admin with your own.` : "Choose a new password for your account."}
          </p>
        </div>
        <PasswordForm first={user.mustChangePassword} />
      </div>
    </div>
  );
}
