"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Megaphone, Pin } from "lucide-react";
import { api } from "@/lib/api/client";
import { formatStamp } from "@/lib/weeks";
import { Initials } from "./initials";

export interface FeedPost {
  id: string;
  kind: "note" | "announcement";
  body: string;
  pinned: boolean;
  createdAt: string;
  author: { id: string; name: string };
}

export function Feed({ groupId, posts, canManage }: { groupId: string; posts: FeedPost[]; canManage: boolean }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [announce, setAnnounce] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="grid gap-3">
      <form
        className="card grid gap-2 p-3"
        style={{ boxShadow: "var(--shadow)" }}
        onSubmit={async (e) => {
          e.preventDefault();
          if (!body.trim()) return;
          setBusy(true);
          setError("");
          try {
            await api(`/groups/${groupId}/posts`, { body: { body, kind: announce ? "announcement" : "note", pinned: announce } });
            setBody("");
            setAnnounce(false);
            router.refresh();
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="sr-only" htmlFor="post-body">
          Write on the wall
        </label>
        <textarea id="post-body" className="field" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share progress, a link or a question…" maxLength={5000} />
        <div className="flex items-center gap-3">
          {canManage && (
            <label className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" checked={announce} onChange={(e) => setAnnounce(e.target.checked)} className="accent-ink" /> Pin as announcement
            </label>
          )}
          <button className="btn btn-ink btn-sm ml-auto" type="submit" disabled={busy}>
            Post
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </form>
      {posts.map((p) => (
        <article key={p.id} className={`feed-item ${p.kind}`}>
          <div className="flex items-center gap-2">
            <Initials name={p.author.name} />
            <b className="text-sm">{p.author.name}</b>
            {p.kind === "announcement" && <Megaphone size={14} aria-label="Announcement" />}
            {p.pinned && <Pin size={14} aria-label="Pinned" />}
            <span className="mono ml-auto text-[11px] text-muted">{formatStamp(p.createdAt)}</span>
          </div>
          <p className="whitespace-pre-wrap text-[15px]">{p.body}</p>
        </article>
      ))}
      {!posts.length && <p className="mono text-xs text-muted">No posts yet.</p>}
    </div>
  );
}
