"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { BookOpen, FileText, FolderGit2, HardDrive, ImageIcon, Leaf, Link2, Paperclip, Plus, X } from "lucide-react";
import { api } from "@/lib/api/client";

export interface WallLink {
  id: string;
  taskId: string | null;
  kind: "overleaf" | "github" | "drive" | "paper" | "other";
  url: string;
  label: string | null;
  addedBy: { id: string; name: string } | null;
}
export interface WallFile {
  id: string;
  taskId: string | null;
  filename: string;
  mime: string;
  size: number;
  uploader: { id: string; name: string } | null;
}

const KIND = {
  overleaf: { icon: Leaf, name: "Overleaf", c: "var(--color-lime)" },
  github: { icon: FolderGit2, name: "GitHub", c: "var(--color-violet)" },
  drive: { icon: HardDrive, name: "Drive", c: "var(--color-blue)" },
  paper: { icon: BookOpen, name: "Paper", c: "var(--color-orange)" },
  other: { icon: Link2, name: "Link", c: "var(--color-paper-2)" },
};

function hostOf(url: string) {
  try {
    const u = new URL(url);
    return (u.hostname.replace(/^www\./, "") + u.pathname).replace(/\/$/, "").slice(0, 40);
  } catch {
    return url;
  }
}

export const fileSize = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

async function remove(path: string, router: ReturnType<typeof useRouter>, setError: (s: string) => void) {
  try {
    await api(path, { method: "DELETE" });
    router.refresh();
  } catch (e) {
    setError((e as Error).message);
  }
}

/** Link and file chips with an optional "remove" button when the viewer may delete them. */
export function Resources({ links, files, me, canManage, small }: { links: WallLink[]; files: WallFile[]; me: string; canManage: boolean; small?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  if (!links.length && !files.length) return null;
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-1">
      <ul className={`res ${small ? "res-sm" : ""}`}>
        {links.map((l) => {
          const k = KIND[l.kind];
          const Icon = k.icon;
          return (
            <li key={l.id} style={{ "--c": k.c } as React.CSSProperties}>
              <a href={l.url} target="_blank" rel="noopener noreferrer nofollow" title={`${l.url}${l.addedBy ? ` · added by ${l.addedBy.name}` : ""}`}>
                <Icon size={small ? 13 : 15} aria-hidden />
                <b>{l.label || k.name}</b>
                {!small && <span>{hostOf(l.url)}</span>}
              </a>
              {(canManage || l.addedBy?.id === me) && (
                <button type="button" aria-label={`Remove link ${l.label || k.name}`} onClick={() => remove(`/links/${l.id}`, router, setError)}>
                  <X size={12} aria-hidden />
                </button>
              )}
            </li>
          );
        })}
        {files.map((f) => {
          const Icon = f.mime.startsWith("image/") ? ImageIcon : FileText;
          return (
            <li key={f.id} style={{ "--c": "var(--color-card)" } as React.CSSProperties}>
              <a href={`/api/v1/attachments/${f.id}`} target="_blank" rel="noopener" title={`${f.filename}${f.uploader ? ` · uploaded by ${f.uploader.name}` : ""}`}>
                <Icon size={small ? 13 : 15} aria-hidden />
                <b>{f.filename}</b>
                <span>{fileSize(f.size)}</span>
              </a>
              {(canManage || f.uploader?.id === me) && (
                <button type="button" aria-label={`Remove file ${f.filename}`} onClick={() => confirm(`Remove ${f.filename}?`) && remove(`/attachments/${f.id}`, router, setError)}>
                  <X size={12} aria-hidden />
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

/** "+ Link" and "+ File" buttons that post to the group (optionally for one task). */
export function AddResource({ groupId, taskId, small, linkPlaceholder, fileOnly }: { groupId: string; taskId?: string; small?: boolean; linkPlaceholder?: string; fileOnly?: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"" | "link">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    if (file.size > 10 * 1024 * 1024) return setError("Files can be at most 10 MB.");
    setBusy(true);
    setError("");
    const form = new FormData();
    form.set("file", file);
    if (taskId) form.set("taskId", taskId);
    try {
      const res = await fetch(`/api/v1/groups/${groupId}/attachments`, { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error?.message ?? `Upload failed (${res.status})`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        {!fileOnly && (
          <button type="button" className={`btn ${small ? "btn-xs" : "btn-sm"}`} onClick={() => setMode(mode === "link" ? "" : "link")} aria-expanded={mode === "link"}>
            <Plus size={13} aria-hidden /> Link
          </button>
        )}
        <button type="button" className={`btn ${small ? "btn-xs" : "btn-sm"}`} disabled={busy} onClick={() => input.current?.click()}>
          <Paperclip size={13} aria-hidden /> {busy ? "Uploading…" : fileOnly ? "Upload a file" : "File"}
        </button>
        <input
          ref={input}
          type="file"
          hidden
          accept="application/pdf,image/png,image/jpeg,image/gif,image/webp"
          aria-label="Attach a PDF or image"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
      </div>
      {mode === "link" && (
        <form
          className="grid gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setError("");
            try {
              await api(`/groups/${groupId}/links`, { body: { url: f.get("url"), label: f.get("label"), taskId: taskId ?? null } });
              setMode("");
              router.refresh();
            } catch (err) {
              setError((err as Error).message);
            }
          }}
        >
          <input className="field field-sm" name="url" type="url" required placeholder={linkPlaceholder ?? "https://github.com/…"} aria-label="Link URL" />
          <input className="field field-sm" name="label" maxLength={120} placeholder="Label (optional)" aria-label="Link label" />
          <button className="btn btn-ink btn-sm" type="submit">
            Add
          </button>
        </form>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
