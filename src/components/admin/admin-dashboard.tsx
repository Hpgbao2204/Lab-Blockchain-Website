"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { RefreshCw } from "lucide-react";
import { AccountManager } from "@/components/admin/account-manager";
import { getAdminCopy } from "@/components/admin/admin-copy";
import { TeamTaskManager } from "@/components/admin/team-task-manager";
import { useTranslation } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { ToastContainer, useToast } from "@/components/ui/toast";
import { getFirebaseClientAuth } from "@/lib/firebase/client";

type View = "accounts" | "walls";

export function AdminDashboard() {
  const { locale } = useTranslation();
  const text = getAdminCopy(locale);
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useMemo(() => getFirebaseClientAuth(), []);
  const { toasts, show: showToast, dismiss: dismissToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const view: View = searchParams.get("view") === "accounts" ? "accounts" : "walls";

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      router.replace("/admin/login");
      return;
    }
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (!currentUser) {
        const query = searchParams.toString();
        const currentPath = query ? `/admin?${query}` : "/admin";
        router.replace(`/admin/login?redirect=${encodeURIComponent(currentPath)}`);
      }
    });
  }, [auth, router, searchParams]);

  const getHeaders = useCallback(async (): Promise<HeadersInit | null> => {
    if (!user) return null;
    return {
      Authorization: `Bearer ${await user.getIdToken()}`,
      "Content-Type": "application/json"
    };
  }, [user]);

  const handleForbidden = useCallback(() => {
    void (async () => {
      try {
        if (auth) await signOut(auth);
      } finally {
        router.replace("/admin/login?error=unauthorized");
      }
    })();
  }, [auth, router]);

  async function handleSignOut() {
    if (auth) await signOut(auth);
    router.replace("/admin/login");
  }

  function navigate(next: View) {
    router.replace(next === "walls" ? "/admin" : "/admin?view=accounts", {
      scroll: false
    });
  }

  function clearSelectedWall() {
    router.replace("/admin", { scroll: false });
  }

  if (authLoading || !user) {
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
    <section className="min-h-screen bg-background">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Blockchainist
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-foreground">
              {text.workspace}
            </h1>
            <p className="mt-1 text-sm text-muted">{user.email}</p>
          </div>
          <Button type="button" variant="ghost" onClick={() => void handleSignOut()}>
            {text.signOut}
          </Button>
        </header>
        <nav className="mb-8 flex gap-2 border-b border-border" aria-label="Khu vực quản trị">
          <button
            type="button"
            onClick={() => navigate("accounts")}
            className={`border-b-2 px-4 py-3 text-sm font-semibold ${view === "accounts" ? "border-primary text-primary" : "border-transparent text-muted"}`}
          >
            {text.accounts}
          </button>
          <button
            type="button"
            onClick={() => navigate("walls")}
            className={`border-b-2 px-4 py-3 text-sm font-semibold ${view === "walls" ? "border-primary text-primary" : "border-transparent text-muted"}`}
          >
            {text.teams}
          </button>
        </nav>
        {view === "accounts" ? (
          <AccountManager
            getHeaders={getHeaders}
            onForbidden={handleForbidden}
            notify={showToast}
          />
        ) : (
          <TeamTaskManager
            getHeaders={getHeaders}
            onForbidden={handleForbidden}
            notify={showToast}
            selectedWallSlug={searchParams.get("wall") ?? undefined}
            onClearSelectedWall={clearSelectedWall}
          />
        )}
      </div>
    </section>
  );
}
