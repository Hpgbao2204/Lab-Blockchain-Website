"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogIn, RefreshCw, UserRound } from "lucide-react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { WallFeed } from "@/components/walls/wall-feed";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ToastContainer, useToast } from "@/components/ui/toast";
import { getFirebaseClientAuth } from "@/lib/firebase/client";
import { getWallDestination } from "@/lib/walls/wall-destination";
import type { Team } from "@/types/content";

async function messageFor(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  return typeof body?.error === "string" ? body.error : fallback;
}

export function WallsWorkspace({ slug, entry = false }: { slug?: string; entry?: boolean }) {
  const router = useRouter();
  const { toasts, show: showToast, dismiss: dismissToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [walls, setWalls] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [view, setView] = useState<"login" | "forgot">("login");

  const headers = useCallback(async (): Promise<HeadersInit | null> => {
    if (!user) return null;
    return { Authorization: `Bearer ${await user.getIdToken()}` };
  }, [user]);

  const loadWalls = useCallback(async (activeUser: User) => {
    const response = await fetch("/api/teams", { headers: { Authorization: `Bearer ${await activeUser.getIdToken()}` } });
    if (!response.ok) throw new Error(await messageFor(response, "Không thể tải Wall của bạn."));
    const body = await response.json();
    setWalls(Array.isArray(body.data) ? body.data : []);
  }, []);

  const openWall = useCallback(async (activeUser: User) => {
    if (!slug) return;
    const response = await fetch(`/api/walls/${encodeURIComponent(slug)}`, {
      headers: { Authorization: `Bearer ${await activeUser.getIdToken()}` }
    });
    if (!response.ok) throw new Error(await messageFor(response, "Không thể mở Wall."));
    const body = await response.json();
    const role = body?.data?.viewer?.role;
    if (role !== "owner" && role !== "member") throw new Error("Không thể xác định quyền truy cập Wall.");
    router.replace(getWallDestination(slug, role));
  }, [router, slug]);

  useEffect(() => {
    const auth = getFirebaseClientAuth();
    if (!auth) {
      setMessage("Firebase Authentication chưa được cấu hình.");
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, (activeUser) => {
      setUser(activeUser);
      if (!activeUser) {
        setWalls([]);
        setLoading(false);
        return;
      }
      if (entry) {
        setLoading(true);
        void openWall(activeUser)
          .catch((error) => {
            setMessage(error instanceof Error ? error.message : "Không thể mở Wall.");
            setLoading(false);
          });
        return;
      }
      if (slug) {
        setLoading(false);
        return;
      }
      setLoading(true);
      void loadWalls(activeUser)
        .catch((error) => setMessage(error instanceof Error ? error.message : "Không thể tải Wall của bạn."))
        .finally(() => setLoading(false));
    });
  }, [entry, loadWalls, openWall, slug]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const auth = getFirebaseClientAuth();
    if (!auth) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setMessage("");
    try {
      await signInWithEmailAndPassword(auth, String(form.get("email") ?? ""), String(form.get("password") ?? ""));
    } catch {
      setMessage("Email hoặc mật khẩu không chính xác.");
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const auth = getFirebaseClientAuth();
    if (!auth) return;
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error(await messageFor(response, "Không thể gửi email đặt lại mật khẩu."));
      showToast("Đã gửi liên kết đặt lại mật khẩu. Kiểm tra email của bạn.");
      setView("login");
    } catch {
      setMessage("Không thể gửi email đặt lại mật khẩu. Kiểm tra lại địa chỉ email.");
    } finally {
      setSaving(false);
    }
  }

  const leaveWorkspace = useCallback(async () => {
    const auth = getFirebaseClientAuth();
    try {
      if (auth) await signOut(auth);
      router.replace("/portal/walls");
    } catch {
      showToast("Không thể đăng xuất. Vui lòng thử lại.", "error");
    }
  }, [router, showToast]);

  if (loading) return <section className="mx-auto flex min-h-[50vh] max-w-7xl items-center justify-center px-5"><p className="inline-flex items-center gap-2 text-sm text-muted"><RefreshCw className="h-4 w-4 animate-spin" />Đang tải Portal...</p></section>;

  if (!user) {
    return <section className="mx-auto max-w-md px-5 py-14 sm:py-20"><ToastContainer toasts={toasts} onDismiss={dismissToast} /><Card>
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-primary">Blockchainist</p>
      {view === "forgot" ? <><h1 className="mt-2 text-2xl font-semibold text-foreground">Đặt lại mật khẩu</h1><p className="mt-2 text-sm leading-6 text-muted">Nhập email tài khoản để nhận liên kết đặt lại mật khẩu.</p><form className="mt-6 grid gap-4" onSubmit={resetPassword}><label className="grid gap-1 text-sm font-medium text-foreground">Email<Input name="email" type="email" autoComplete="email" required /></label><Button type="submit" disabled={saving}>{saving ? "Đang gửi..." : "Gửi liên kết"}</Button><button type="button" className="text-left text-sm font-medium text-primary hover:underline" onClick={() => { setView("login"); setMessage(""); }}>Quay lại đăng nhập</button></form></> : <><h1 className="mt-2 text-2xl font-semibold text-foreground">Đăng nhập Portal</h1><p className="mt-2 text-sm leading-6 text-muted">Xem Wall được giao, trao đổi và cập nhật ghi chú công việc.</p><form className="mt-6 grid gap-4" onSubmit={signIn}><label className="grid gap-1 text-sm font-medium text-foreground">Email<Input name="email" type="email" autoComplete="email" required /></label><label className="grid gap-1 text-sm font-medium text-foreground">Mật khẩu<Input name="password" type="password" autoComplete="current-password" required /></label><Button type="submit" disabled={saving}><LogIn className="h-4 w-4" />{saving ? "Đang đăng nhập..." : "Đăng nhập"}</Button><button type="button" className="text-left text-sm font-medium text-primary hover:underline" onClick={() => { setView("forgot"); setMessage(""); }}>Quên mật khẩu?</button></form></>}
      {message ? <p className="mt-4 text-sm text-red-700">{message}</p> : null}
    </Card></section>;
  }

  if (entry) {
    if (!message) return <section className="mx-auto flex min-h-[50vh] max-w-7xl items-center justify-center px-5"><p className="inline-flex items-center gap-2 text-sm text-muted"><RefreshCw className="h-4 w-4 animate-spin" />Đang mở Wall...</p></section>;
    return <section className="mx-auto max-w-xl px-5 py-14 sm:py-20"><Card><h1 className="text-2xl font-semibold text-foreground">Không thể mở Wall</h1><p className="mt-2 text-sm leading-6 text-red-700">{message}</p><Button href="/portal/walls" variant="secondary" className="mt-6"><ArrowLeft className="h-4 w-4" />Về Wall của tôi</Button></Card></section>;
  }

  return <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
    <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    {slug ? <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <Link href="/portal/walls" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"><ArrowLeft className="h-4 w-4" />Tất cả Wall</Link>
        <Button href="/portal/profile" variant="secondary"><UserRound className="h-4 w-4" />Hồ sơ</Button>
      </div>
      <WallFeed slug={slug} getHeaders={headers} onForbidden={leaveWorkspace} notify={showToast} />
    </> : <>
      <header className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div><p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-primary">Portal thành viên</p><h1 className="mt-2 text-2xl font-semibold text-foreground">Wall của tôi</h1></div>
        <Button href="/portal/profile" variant="secondary"><UserRound className="h-4 w-4" />Hồ sơ</Button>
      </header>
      <div className="grid gap-4">{message ? <Card><p className="text-sm text-red-700">{message}</p></Card> : null}{walls.length ? walls.map((wall) => <Link key={wall.id} href={`/portal/walls/${wall.slug}`} className="block rounded-lg border border-border bg-surface p-5 shadow-sm transition-colors hover:border-primary/40 hover:bg-surface-muted"><h2 className="text-lg font-semibold text-foreground">{wall.name}</h2>{wall.description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{wall.description}</p> : null}</Link>) : <Card><p className="py-8 text-center text-sm text-muted">Bạn chưa được phân vào Wall nào.</p></Card>}</div>
    </>}
  </section>;
}
