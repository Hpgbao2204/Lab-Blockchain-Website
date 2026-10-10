import Link from "next/link";
import { Eye, PenLine } from "lucide-react";
import { NEWS_KIND, newsDate, postHref, type NewsKind } from "@/components/news/news-card";

export interface PostRowData {
  id: string;
  slug: string;
  kind: NewsKind;
  title: string;
  summary: string;
  status: "draft" | "submitted" | "published" | "rejected";
  publishedOn: string;
  updatedAt: Date;
  reviewNote: string | null;
  author: { name: string; slug: string | null } | null;
  aiAssisted?: boolean;
  /** the bot's fact-check notes (admins only) */
  aiCheck?: string | null;
}

export const POST_STATE: Record<PostRowData["status"], { label: string; c: string }> = {
  draft: { label: "Draft", c: "var(--color-card)" },
  submitted: { label: "Waiting for review", c: "var(--color-yellow)" },
  published: { label: "Published", c: "var(--color-lime)" },
  rejected: { label: "Sent back", c: "var(--color-red)" },
};

/** One post in a list of the member's own posts, or in the admin's list. */
export function PostRow({ post, showAuthor = false, today, children }: { post: PostRowData; showAuthor?: boolean; today: string; children?: React.ReactNode }) {
  const k = NEWS_KIND[post.kind];
  const scheduled = post.status === "published" && post.publishedOn > today;
  const state = scheduled ? { label: "Scheduled", c: "var(--color-blue)" } : POST_STATE[post.status];
  return (
    <div className="card grid gap-2 p-4" style={{ "--c": k.c, boxShadow: "var(--shadow)" } as React.CSSProperties}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="tag">{k.label}</span>
        <span className="tag" style={{ "--c": state.c } as React.CSSProperties}>
          {state.label}
        </span>
        <span className="mono text-xs text-muted">{post.status === "published" ? newsDate(post.publishedOn) : `edited ${newsDate(post.updatedAt.toISOString().slice(0, 10))}`}</span>
        {showAuthor && <span className="text-sm">· {post.aiAssisted ? "Daily desk (AI draft)" : (post.author?.name ?? "former member")}</span>}
      </div>
      <h3 className="font-bold leading-snug">{post.title}</h3>
      <p className="line-clamp-2 text-sm text-ink-2">{post.summary}</p>
      {post.aiAssisted && post.status === "submitted" && (
        <div className="grid gap-1 rounded-[10px] border-2 border-dashed border-ink p-2 text-sm">
          <b>AI draft: check it against the sources before approving.</b>
          {post.aiCheck ? (
            <>
              <span>The automatic check could not match these sentences to a source:</span>
              <span className="whitespace-pre-line text-ink-2">{post.aiCheck}</span>
            </>
          ) : (
            <span className="text-ink-2">The automatic check found no unsupported claims.</span>
          )}
        </div>
      )}
      {post.status === "rejected" && post.reviewNote && (
        <p className="whitespace-pre-line rounded-[10px] border-2 border-dashed border-ink p-2 text-sm">
          <b>Admin note:</b> {post.reviewNote}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Link href={post.kind === "tutorial" ? `/admin/tutorials/${post.id}` : `/app/posts/${post.id}`} className="btn btn-xs">
          <PenLine size={12} aria-hidden /> {post.status === "published" && !showAuthor ? "Open" : "Edit"}
        </Link>
        <Link href={postHref(post)} className="btn btn-xs">
          <Eye size={12} aria-hidden /> {post.status === "published" && !scheduled ? "View" : "Preview"}
        </Link>
        {children}
      </div>
    </div>
  );
}
