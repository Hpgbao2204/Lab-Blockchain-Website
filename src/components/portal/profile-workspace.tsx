"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUp, CircleHelp, LogIn, LogOut, Plus, Save, Trash2 } from "lucide-react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ToastContainer, useToast } from "@/components/ui/toast";
import { useTranslation } from "@/components/i18n/locale-provider";
import { getProfileCopy, type ProfileCopy } from "@/components/portal/profile-copy";
import { getFirebaseClientAuth } from "@/lib/firebase/client";

type Profile = {
  slug: string;
  name: string;
  role: string;
  avatar?: { url?: string };
  bio?: string;
  links: Record<string, string | undefined>;
  researchInterests: string[];
  education: string[];
  achievements: string[];
  cvUrl?: string;
  publicationIds: string[];
  projectIds: string[];
  isPublic: boolean;
};

type ResearchOutput = { id: string; title: string; year?: number; venue?: string };

type ProfileForm = {
  slug: string;
  name: string;
  role: string;
  avatarUrl: string;
  bio: string;
  googleScholar: string;
  orcid: string;
  webOfScience: string;
  scopus: string;
  website: string;
  github: string;
  researchInterests: string;
  education: string;
  achievements: string;
  cvUrl: string;
  publicationIds: string[];
  projectIds: string[];
  isPublic: boolean;
};

function toForm(profile: Profile): ProfileForm {
  return {
    slug: profile.slug,
    name: profile.name,
    role: profile.role,
    avatarUrl: profile.avatar?.url ?? "",
    bio: profile.bio ?? "",
    googleScholar: profile.links.googleScholar ?? "",
    orcid: profile.links.orcid ?? "",
    webOfScience: profile.links.webOfScience ?? "",
    scopus: profile.links.scopus ?? "",
    website: profile.links.website ?? "",
    github: profile.links.github ?? "",
    researchInterests: profile.researchInterests.join("\n"),
    education: profile.education.join("\n"),
    achievements: profile.achievements.join("\n"),
    cvUrl: profile.cvUrl ?? "",
    publicationIds: profile.publicationIds ?? [],
    projectIds: profile.projectIds ?? [],
    isPublic: profile.isPublic
  };
}

function list(value: string) {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function nullable(value: string) {
  return value.trim() || null;
}

async function messageFor(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  return typeof body?.error === "string" ? body.error : fallback;
}

export function ProfileWorkspace() {
  const { locale, t } = useTranslation();
  const copy = getProfileCopy(locale);
  const router = useRouter();
  const { toasts, show: showToast, dismiss: dismissToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileForm | null>(null);
  const [publications, setPublications] = useState<ResearchOutput[]>([]);
  const [projects, setProjects] = useState<ResearchOutput[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [view, setView] = useState<"login" | "forgot" | "forgot-sent">("login");

  useEffect(() => {
    const auth = getFirebaseClientAuth();
    if (!auth) {
      setMessage("Firebase Authentication is not configured for this deployment.");
      setLoading(false);
      return;
    }

    async function loadProfile(activeUser: User) {
      setLoading(true);
      setMessage("");
      const token = await activeUser.getIdToken();
      const [response, publicationsResponse, projectsResponse] = await Promise.all([
        fetch("/api/portal/profile", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/publications"),
        fetch("/api/projects")
      ]);
      if (!response.ok) {
        setProfile(null);
        setMessage(await messageFor(response, "Unable to load your member profile."));
        setLoading(false);
        return;
      }
      const [body, publicationsBody, projectsBody] = await Promise.all([
        response.json(),
        publicationsResponse.ok ? publicationsResponse.json() : Promise.resolve({ data: [] }),
        projectsResponse.ok ? projectsResponse.json() : Promise.resolve({ data: [] })
      ]);
      setProfile(toForm(body.data as Profile));
      setPublications(Array.isArray(publicationsBody.data) ? publicationsBody.data : []);
      setProjects(Array.isArray(projectsBody.data) ? projectsBody.data : []);
      setLoading(false);
    }

    return onAuthStateChanged(auth, (activeUser) => {
      setUser(activeUser);
      if (!activeUser) {
        setProfile(null);
        setLoading(false);
        return;
      }
      void loadProfile(activeUser).catch(() => {
        setMessage("Unable to load your member profile.");
        setLoading(false);
      });
    });
  }, []);

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
      setMessage("Unable to sign in with that email and password.");
    } finally {
      setSaving(false);
    }
  }

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (!response.ok) throw new Error(await messageFor(response, "Không thể gửi email đặt lại mật khẩu."));
      setView("forgot-sent");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể gửi email đặt lại mật khẩu.");
    } finally {
      setSaving(false);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !profile) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/portal/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          avatarUrl: nullable(profile.avatarUrl),
          bio: nullable(profile.bio),
          links: {
            googleScholar: nullable(profile.googleScholar),
            orcid: nullable(profile.orcid),
            webOfScience: nullable(profile.webOfScience),
            scopus: nullable(profile.scopus),
            website: nullable(profile.website),
            github: nullable(profile.github)
          },
          researchInterests: list(profile.researchInterests),
          education: list(profile.education),
          achievements: list(profile.achievements),
          cvUrl: nullable(profile.cvUrl),
          publicationIds: profile.publicationIds,
          projectIds: profile.projectIds,
          isPublic: profile.isPublic
        })
      });
      if (!response.ok) throw new Error(await messageFor(response, t("portalProfileSaveError")));
      const body = await response.json();
      setProfile(toForm(body.data as Profile));
      showToast(t("portalProfileSaved"), "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("portalProfileSaveError"), "error");
    } finally {
      setSaving(false);
    }
  }

  async function leaveWorkspace() {
    const auth = getFirebaseClientAuth();
    try {
      if (auth) await signOut(auth);
      router.replace("/portal");
    } catch {
      showToast(t("portalSignOutError"), "error");
    }
  }

  if (loading) {
    return <section className="mx-auto max-w-3xl px-6 py-16"><p className="text-sm text-muted">{t("portalLoadingProfile")}</p></section>;
  }

  if (!user) {
    if (view === "forgot-sent") {
      return (
        <section className="mx-auto max-w-md px-6 py-16">
          <Card>
            <div className="mb-6">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-primary">Blockchainist</p>
              <h1 className="mt-2 text-2xl font-semibold text-foreground">Kiểm tra email</h1>
              <p className="mt-2 text-sm leading-6 text-muted">
                Nếu tài khoản tồn tại với email này, bạn sẽ sớm nhận được liên kết đặt lại mật khẩu.
              </p>
            </div>
            <div className="grid gap-4">
              <div className="rounded-md border border-border bg-surface-muted p-4 text-sm text-foreground">
                <p className="font-medium">Đã gửi liên kết đặt lại mật khẩu</p>
                <p className="mt-1 text-muted">Kiểm tra hộp thư đến và thư rác. Liên kết sẽ hết hạn sau một thời gian ngắn.</p>
              </div>
              <button
                type="button"
                className="text-sm text-primary hover:underline text-left"
                onClick={() => { setView("login"); setMessage(""); }}
              >
                ← Quay lại đăng nhập
              </button>
            </div>
          </Card>
        </section>
      );
    }

    if (view === "forgot") {
      return (
        <section className="mx-auto max-w-md px-6 py-16">
          <Card>
            <div className="mb-6">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-primary">Blockchainist</p>
              <h1 className="mt-2 text-2xl font-semibold text-foreground">Đặt lại mật khẩu</h1>
              <p className="mt-2 text-sm leading-6 text-muted">
                Nhập email tài khoản để nhận liên kết đặt lại mật khẩu.
              </p>
            </div>
            {message ? <p className="mb-4 rounded-md border border-border bg-surface-muted p-3 text-sm text-foreground">{message}</p> : null}
            <form onSubmit={handleForgotPassword} className="grid gap-4">
              <label className="grid gap-1 text-sm font-medium text-foreground">
                Email
                <Input
                  id="forgot-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                />
              </label>
              <Button type="submit" disabled={saving}>
                {saving ? "Đang gửi..." : "Gửi liên kết đặt lại mật khẩu"}
              </Button>
              <button
                type="button"
                className="text-sm text-primary hover:underline text-left"
                onClick={() => { setView("login"); setMessage(""); }}
              >
                ← Quay lại đăng nhập
              </button>
            </form>
          </Card>
        </section>
      );
    }

    return (
      <section className="mx-auto max-w-md px-6 py-16">
        <Card>
          <div className="mb-6">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-primary">Blockchainist</p>
            <h1 className="mt-2 text-2xl font-semibold text-foreground">{t("portalWorkspaceTitle")}</h1>
            <p className="mt-2 text-sm leading-6 text-muted">{t("portalWorkspaceDescription")}</p>
          </div>
          {message ? <p className="mb-4 rounded-md border border-border bg-surface-muted p-3 text-sm text-foreground">{message}</p> : null}
          <form onSubmit={signIn} className="grid gap-4">
            <label className="grid gap-1 text-sm font-medium text-foreground">
              {t("portalEmail")}
              <Input id="login-email" name="email" type="email" autoComplete="email" required />
            </label>
            <label className="grid gap-1 text-sm font-medium text-foreground">
              {t("portalPassword")}
              <Input id="login-password" name="password" type="password" autoComplete="current-password" required />
            </label>
            <Button type="submit" id="sign-in-button" disabled={saving}>
              <LogIn className="h-4 w-4" />{saving ? t("portalSigningIn") : t("portalSignIn")}
            </Button>
            <button
              type="button"
              id="forgot-password-link"
              className="text-sm text-primary hover:underline text-left"
              onClick={() => { setView("forgot"); setMessage(""); }}
            >
              Quên mật khẩu?
            </button>
          </form>
        </Card>
      </section>
    );
  }

  if (!profile) {
    return <section className="mx-auto max-w-3xl px-6 py-16"><Card><div className="flex items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold text-foreground">{t("portalProfileUnavailable")}</h1><p className="mt-2 text-sm leading-6 text-muted">{message || t("portalProfileUnlinked")}</p></div><Button type="button" variant="secondary" onClick={() => void leaveWorkspace()}><LogOut className="h-4 w-4" />{t("portalSignOut")}</Button></div></Card></section>;
  }

  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12 xl:px-10">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <div className="mb-4">
        <Link
          href="/portal/walls"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("portalMyWalls")}
        </Link>
      </div>
      <div className="mb-6"><p className="font-mono text-xs uppercase tracking-[0.16em] text-primary">{t("portalWorkspaceTitle")}</p><h1 className="mt-2 text-3xl font-semibold text-foreground">{t("portalYourResearchProfile")}</h1><p className="mt-2 text-sm text-muted">{user.email}</p></div>
      <Card>
        <form onSubmit={saveProfile} className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2"><Field label={copy.name}><Input value={profile.name} readOnly aria-readonly="true" /></Field><Field label={copy.researchRole}><Input value={profile.role} readOnly aria-readonly="true" /></Field></div>
          <div className="rounded-md border border-border bg-surface-muted p-4 text-sm"><p className="font-medium text-foreground">{copy.publicLink}</p><a href={`/members/${profile.slug}`} className="mt-1 block text-primary hover:underline">/members/{profile.slug}</a><p className="mt-1 text-muted">{copy.publicLinkHelp}</p></div>
          <Field label={copy.avatarUrl} helpText={copy.avatarUrlHelp}><Input type="url" value={profile.avatarUrl} onChange={(event) => setProfile({ ...profile, avatarUrl: event.target.value })} placeholder="https://..." /></Field>
          <Field label={copy.bio}><Textarea value={profile.bio} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} /></Field>
          <div className="grid gap-4 md:grid-cols-2"><Field label="Google Scholar"><Input type="url" value={profile.googleScholar} onChange={(event) => setProfile({ ...profile, googleScholar: event.target.value })} /></Field><Field label="ORCID" helpText="Bắt buộc, ví dụ: https://orcid.org/0000-0000-0000-0000"><Input type="url" value={profile.orcid} onChange={(event) => setProfile({ ...profile, orcid: event.target.value })} placeholder="https://orcid.org/0000-0000-0000-0000" required /></Field><Field label="Web of Science"><Input type="url" value={profile.webOfScience} onChange={(event) => setProfile({ ...profile, webOfScience: event.target.value })} /></Field><Field label="Scopus"><Input type="url" value={profile.scopus} onChange={(event) => setProfile({ ...profile, scopus: event.target.value })} /></Field><Field label={copy.personalWebsite}><Input type="url" value={profile.website} onChange={(event) => setProfile({ ...profile, website: event.target.value })} /></Field><Field label="GitHub"><Input type="url" value={profile.github} onChange={(event) => setProfile({ ...profile, github: event.target.value })} /></Field></div>
          <Field label={copy.researchInterests}><Textarea value={profile.researchInterests} onChange={(event) => setProfile({ ...profile, researchInterests: event.target.value })} /></Field>
          <Field label={copy.education}><Textarea value={profile.education} onChange={(event) => setProfile({ ...profile, education: event.target.value })} /></Field>
          <Field label={copy.achievements}><Textarea value={profile.achievements} onChange={(event) => setProfile({ ...profile, achievements: event.target.value })} /></Field>
          <CvReferences label={copy.selectedPublications} copy={copy} selected={profile.publicationIds} options={publications} onChange={(publicationIds) => setProfile({ ...profile, publicationIds })} />
          <CvReferences label={copy.selectedProjects} copy={copy} selected={profile.projectIds} options={projects} onChange={(projectIds) => setProfile({ ...profile, projectIds })} />
          <Field label={copy.cvUrl} helpText={copy.cvUrlHelp}><Input type="url" value={profile.cvUrl} onChange={(event) => setProfile({ ...profile, cvUrl: event.target.value })} placeholder="https://drive.google.com/..." /></Field>
          <label className="flex items-start gap-3 rounded-md border border-border bg-surface-muted p-4 text-sm text-foreground"><input type="checkbox" checked={profile.isPublic} onChange={(event) => setProfile({ ...profile, isPublic: event.target.checked })} className="mt-1 h-4 w-4 accent-primary" /><span><span className="block font-medium">{copy.showPublic}</span><span className="mt-1 block text-muted">{copy.showPublicHelp}</span></span></label>
          <div className="flex justify-end"><Button type="submit" disabled={saving}><Save className="h-4 w-4" />{saving ? copy.saving : copy.save}</Button></div>
        </form>
      </Card>
    </section>
  );
}

function Field({ label, helpText, children }: { label: string; helpText?: string; children: React.ReactNode }) {
  return <label className="grid gap-1 text-sm font-medium text-foreground"><span className="flex items-center gap-1.5">{label}{helpText ? <span className="inline-flex text-muted" title={helpText} aria-label={helpText}><CircleHelp className="h-4 w-4" aria-hidden="true" /></span> : null}</span>{children}</label>;
}

function CvReferences({ label, copy, selected, options, onChange }: { label: string; copy: ProfileCopy; selected: string[]; options: ResearchOutput[]; onChange: (ids: string[]) => void }) {
  const selectedRecords = selected.map((id) => ({ id, record: options.find((option) => option.id === id) }));
  const availableRecords = options.filter((option) => !selected.includes(option.id));

  function move(index: number, direction: -1 | 1) {
    const next = [...selected];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="grid gap-3 rounded-md border border-border p-4">
      <div><p className="text-sm font-medium text-foreground">{label}</p><p className="mt-1 text-xs text-muted">{copy.selectionHint}</p></div>
      {selectedRecords.length ? <div className="grid gap-2">{selectedRecords.map(({ id, record }, index) => { const title = record?.title ?? copy.unavailableRecord; return <div key={id} className="flex items-center gap-2 border-b border-border pb-2 last:border-b-0 last:pb-0"><p className="min-w-0 flex-1 text-sm text-foreground">{title}{record?.year ? <span className="text-muted"> ({record.year})</span> : null}</p><Button type="button" variant="ghost" className="min-h-8 px-2" aria-label={copy.moveUp.replace("{title}", title)} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp className="h-4 w-4" /></Button><Button type="button" variant="ghost" className="min-h-8 px-2" aria-label={copy.moveDown.replace("{title}", title)} disabled={index === selected.length - 1} onClick={() => move(index, 1)}><ArrowDown className="h-4 w-4" /></Button><Button type="button" variant="ghost" className="min-h-8 px-2 text-destructive" aria-label={copy.remove.replace("{title}", title)} onClick={() => onChange(selected.filter((value) => value !== id))}><Trash2 className="h-4 w-4" /></Button></div>; })}</div> : <p className="text-sm text-muted">{copy.noRecords}</p>}
      {availableRecords.length ? <details><summary className="cursor-pointer text-sm font-medium text-primary">{copy.addRecord}</summary><div className="mt-3 grid max-h-64 gap-2 overflow-y-auto">{availableRecords.map((record) => <button key={record.id} type="button" onClick={() => onChange([...selected, record.id])} className="flex items-start gap-2 rounded-md border border-border p-3 text-left text-sm text-foreground hover:bg-surface-muted"><Plus className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{record.title}{record.year ? <span className="text-muted"> ({record.year})</span> : null}</span></button>)}</div></details> : null}
    </div>
  );
}
