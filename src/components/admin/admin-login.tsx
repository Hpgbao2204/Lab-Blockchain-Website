"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { RefreshCw, ShieldAlert } from "lucide-react";
import { getAdminCopy } from "@/components/admin/admin-copy";
import { useTranslation } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSafeAdminRedirect } from "@/lib/admin-redirect";
import { getFirebaseClientAuth } from "@/lib/firebase/client";

export function AdminLogin() {
  const { locale } = useTranslation();
  const text = getAdminCopy(locale);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = getSafeAdminRedirect(searchParams.get("redirect"));
  const accessDenied = searchParams.get("error") === "unauthorized" ? text.accessDenied : "";

  const auth = useMemo(() => getFirebaseClientAuth(), []);
  const [authLoading, setAuthLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace(redirectUrl);
      } else {
        setAuthLoading(false);
      }
    });
  }, [auth, redirectUrl, router]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!auth) return setMessage(text.loginFailed);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setMessage(
        error instanceof Error && error.message.includes("auth/invalid-credential")
          ? text.invalidCredentials
          : text.loginFailed
      );
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted">{text.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <section className="grid min-h-screen place-items-center bg-background px-5 py-10">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Blockchainist
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">
          {text.signInTitle}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          {text.signInDescription}
        </p>
        {message || accessDenied ? (
          <p className="mt-4 flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{message || accessDenied}</span>
          </p>
        ) : null}
        <form onSubmit={signIn} className="mt-6 grid gap-4">
          <label className="grid gap-1 text-sm font-medium text-foreground">
            {text.email}
            <Input name="email" type="email" autoComplete="email" required />
          </label>
          <label className="grid gap-1 text-sm font-medium text-foreground">
            {text.password}
            <Input name="password" type="password" autoComplete="current-password" required />
          </label>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                {text.loading}
              </span>
            ) : (
              text.signIn
            )}
          </Button>
        </form>
      </Card>
    </section>
  );
}
