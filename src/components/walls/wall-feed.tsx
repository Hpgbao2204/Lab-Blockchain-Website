"use client";

import { ComponentPropsWithoutRef, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Pencil, Plus, RefreshCw, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Task, Team, TeamComment } from "@/types/content";
import { resetFormAfter } from "./form-submit";

type WallMember = { id: string; name: string; email: string; role: string; isActive: boolean };
type Viewer = { uid: string; role: "owner" | "member"; memberId: string | null };
type FeedData = { wall: Team; members: WallMember[]; tasks: Task[]; comments: TeamComment[]; viewer: Viewer };
type ToastType = "success" | "error";

type WallFeedProps = {
  slug: string;
  getHeaders: () => Promise<HeadersInit | null>;
  onForbidden?: () => void;
  onManageWall?: (wall: Team) => void;
  notify?: (message: string, type?: ToastType) => void;
};

const statusLabels: Record<Task["status"], string> = {
  in_progress: "Đang làm",
  blocked: "Đang vướng",
  completed: "Hoàn thành",
};

function messageFor(response: Response, fallback: string) {
  return response.json().then((body) => typeof body?.error === "string" ? body.error : fallback).catch(() => fallback);
}

function dateLabel(value?: string) {
  if (!value) return "Chưa đặt hạn";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleDateString("vi-VN");
}

function LinkedText({ children }: { children: string }) {
  const parts = children.split(/(https?:\/\/[^\s]+)/g);
  return <>{parts.map((part, index) => /^https?:\/\//.test(part) ? <a key={`${part}-${index}`} href={part} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">{part}</a> : part)}</>;
}

export function WallFeed({ slug, getHeaders, onForbidden, onManageWall, notify }: WallFeedProps) {
  const [data, setData] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);

  const callbacksRef = useRef({ getHeaders, onForbidden, notify });
  useEffect(() => {
    callbacksRef.current = { getHeaders, onForbidden, notify };
  });

  const load = useCallback(async (silent = false) => {
    const headers = await callbacksRef.current.getHeaders();
    if (!headers) return;
    if (!silent) setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/walls/${encodeURIComponent(slug)}`, { headers });
      if (response.status === 401 || response.status === 403) {
        callbacksRef.current.onForbidden?.();
        return;
      }
      if (!response.ok) throw new Error(await messageFor(response, "Không thể tải Wall."));
      const body = await response.json();
      setData(body.data as FeedData);
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Không thể tải Wall.";
      setMessage(nextMessage);
      callbacksRef.current.notify?.(nextMessage, "error");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [slug]);

  useEffect(() => { void load(); }, [load]);

  const commentsByTask = useMemo(() => {
    const grouped = new Map<string, TeamComment[]>();
    for (const comment of data?.comments ?? []) {
      const comments = grouped.get(comment.targetId) ?? [];
      comments.push(comment);
      grouped.set(comment.targetId, comments);
    }
    return grouped;
  }, [data?.comments]);
  const memberNames = useMemo(() => new Map((data?.members ?? []).map((member) => [member.id, member.name])), [data?.members]);
  const isOwner = data?.viewer.role === "owner";

  async function mutate(url: string, init: RequestInit, fallback: string) {
    const headers = await callbacksRef.current.getHeaders();
    if (!headers) return null;
    const response = await fetch(url, { ...init, headers: { ...headers, ...(init.body ? { "Content-Type": "application/json" } : {}) } });
    if (response.status === 401 || response.status === 403) {
      callbacksRef.current.onForbidden?.();
      return null;
    }
    if (!response.ok) throw new Error(await messageFor(response, fallback));
    return response.json();
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSaving("new-task");
    try {
      const body = await resetFormAfter(formElement, () => mutate("/api/admin/tasks", {
        method: "POST",
        body: JSON.stringify({
          teamId: data.wall.id,
          title: String(form.get("title") ?? ""),
          description: String(form.get("description") ?? ""),
          targetDate: String(form.get("targetDate") ?? "") || undefined,
        }),
      }, "Không thể tạo công việc."));
      if (body?.data) {
        setData((current) => current ? { ...current, tasks: [body.data as Task, ...current.tasks] } : current);
      } else {
        await load(true);
      }
      notify?.("Đã tạo công việc và giao cho toàn bộ thành viên đang hoạt động trong Wall.");
    } catch (error) {
      notify?.(error instanceof Error ? error.message : "Không thể tạo công việc.", "error");
    } finally {
      setSaving(null);
    }
  }

  async function updateTask(task: Task, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(`task-${task.id}`);
    try {
      const body = await mutate(`/api/admin/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: String(form.get("title") ?? ""),
          description: String(form.get("description") ?? ""),
          targetDate: String(form.get("targetDate") ?? "") || undefined,
        }),
      }, "Không thể cập nhật công việc.");
      if (body?.data) {
        setData((current) => current ? { ...current, tasks: current.tasks.map((item) => item.id === task.id ? body.data as Task : item) } : current);
      } else {
        await load(true);
      }
      setEditingTask(null);
      notify?.("Đã cập nhật công việc.");
    } catch (error) {
      notify?.(error instanceof Error ? error.message : "Không thể cập nhật công việc.", "error");
    } finally {
      setSaving(null);
    }
  }

  async function changeStatus(task: Task, status: Task["status"]) {
    setSaving(`status-${task.id}`);
    try {
      const body = await mutate(`/api/admin/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify({ status }) }, "Không thể đổi trạng thái.");
      if (body?.data) setData((current) => current ? { ...current, tasks: current.tasks.map((item) => item.id === task.id ? body.data as Task : item) } : current);
      notify?.("Đã cập nhật trạng thái công việc.");
    } catch (error) {
      notify?.(error instanceof Error ? error.message : "Không thể đổi trạng thái.", "error");
    } finally {
      setSaving(null);
    }
  }

  async function deleteTask(task: Task) {
    if (!window.confirm(`Xóa công việc “${task.title}”?`)) return;
    setSaving(`delete-task-${task.id}`);
    try {
      await mutate(`/api/admin/tasks/${task.id}`, { method: "DELETE" }, "Không thể xóa công việc.");
      setData((current) => current ? { ...current, tasks: current.tasks.filter((item) => item.id !== task.id) } : current);
      notify?.("Đã xóa công việc.");
    } catch (error) {
      notify?.(error instanceof Error ? error.message : "Không thể xóa công việc.", "error");
    } finally {
      setSaving(null);
    }
  }

  async function createComment(task: Task, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSaving(`comment-${task.id}`);
    try {
      const body = await resetFormAfter(formElement, () => mutate("/api/comments", {
        method: "POST",
        body: JSON.stringify({ teamId: task.teamId, targetType: "task", targetId: task.id, body: String(form.get("body") ?? "") }),
      }, "Không thể gửi ghi chú."));
      if (body?.data) {
        setData((current) => current ? { ...current, comments: [...current.comments, body.data as TeamComment] } : current);
      } else {
        await load(true);
      }
      notify?.("Đã gửi ghi chú.");
    } catch (error) {
      notify?.(error instanceof Error ? error.message : "Không thể gửi ghi chú.", "error");
    } finally {
      setSaving(null);
    }
  }

  async function updateComment(comment: TeamComment, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(`edit-comment-${comment.id}`);
    try {
      const body = await mutate(`/api/comments/${comment.id}`, { method: "PATCH", body: JSON.stringify({ body: String(form.get("body") ?? "") }) }, "Không thể cập nhật ghi chú.");
      if (body?.data) {
        setData((current) => current ? {
          ...current,
          comments: current.comments.map((item) => item.id === comment.id ? body.data as TeamComment : item)
        } : current);
      } else {
        await load(true);
      }
      setEditingComment(null);
      notify?.("Đã cập nhật ghi chú.");
    } catch (error) {
      notify?.(error instanceof Error ? error.message : "Không thể cập nhật ghi chú.", "error");
    } finally {
      setSaving(null);
    }
  }

  async function deleteComment(comment: TeamComment) {
    if (!window.confirm("Xóa ghi chú này?")) return;
    setSaving(`delete-comment-${comment.id}`);
    try {
      await mutate(`/api/comments/${comment.id}`, { method: "DELETE" }, "Không thể xóa ghi chú.");
      setData((current) => current ? {
        ...current,
        comments: current.comments.filter((item) => item.id !== comment.id)
      } : current);
      notify?.("Đã xóa ghi chú.");
    } catch (error) {
      notify?.(error instanceof Error ? error.message : "Không thể xóa ghi chú.", "error");
    } finally {
      setSaving(null);
    }
  }

  if (loading) return <Card><div className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted"><RefreshCw className="h-4 w-4 animate-spin" />Đang tải Wall...</div></Card>;
  if (!data) return <Card><p className="text-sm text-red-700">{message || "Không thể tải Wall."}</p><Button type="button" variant="secondary" className="mt-4" onClick={() => void load()}><RefreshCw className="h-4 w-4" />Thử lại</Button></Card>;

  return (
    <div className="grid w-full gap-5">
      <header className="border-b border-border pb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-primary">Wall</p>
            <h1 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">{data.wall.name}</h1>
            {data.wall.description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{data.wall.description}</p> : null}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => void load()} disabled={Boolean(saving)}><RefreshCw className="h-4 w-4" />Làm mới</Button>
            {isOwner && onManageWall ? <Button type="button" variant="secondary" onClick={() => onManageWall(data.wall)}><Users className="h-4 w-4" />Quản lý Wall</Button> : null}
          </div>
        </div>
        <div className="mt-5 border-l-2 border-primary/30 pl-4">
          <p className="text-sm font-medium text-foreground">Thành viên</p>
          <ul className="mt-2 grid gap-1 text-sm text-muted">
            {data.members.map((member) => <li key={member.id}>{member.name} - {member.email || "Chưa có email"}{!member.isActive ? " (đã vô hiệu hóa)" : ""}</li>)}
          </ul>
        </div>
      </header>

      {isOwner ? <Card>
        <form className="grid gap-4" onSubmit={createTask}>
          <div><h2 className="text-lg font-semibold text-foreground">Giao công việc</h2><p className="mt-1 text-sm text-muted">Công việc mới sẽ giao cho toàn bộ thành viên đang hoạt động trong Wall.</p></div>
          <label className="grid gap-1 text-sm font-medium text-foreground">Tên công việc<Input name="title" required maxLength={200} /></label>
          <label className="grid gap-1 text-sm font-medium text-foreground">Mô tả công việc<Textarea name="description" maxLength={4000} /></label>
          <label className="grid gap-1 text-sm font-medium text-foreground">Hạn hoàn thành<Input name="targetDate" type="date" /></label>
          <div><Button type="submit" disabled={saving === "new-task"}><Plus className="h-4 w-4" />{saving === "new-task" ? "Đang tạo..." : "Tạo công việc"}</Button></div>
        </form>
      </Card> : null}

      <div className="grid gap-4">
        {data.tasks.length ? data.tasks.map((task) => {
          const comments = commentsByTask.get(task.id) ?? [];
          return <Card key={task.id} className="p-0">
            <article className="p-5">
              {editingTask === task.id ? <form className="grid gap-3" onSubmit={(event) => void updateTask(task, event)}>
                <label className="grid gap-1 text-sm font-medium text-foreground">Tên công việc<Input name="title" defaultValue={task.title} required maxLength={200} /></label>
                <label className="grid gap-1 text-sm font-medium text-foreground">Mô tả công việc<Textarea name="description" defaultValue={task.description} maxLength={4000} /></label>
                <label className="grid gap-1 text-sm font-medium text-foreground">Hạn hoàn thành<Input name="targetDate" type="date" defaultValue={task.targetDate} /></label>
                <div className="flex gap-2"><Button type="submit" disabled={saving === `task-${task.id}`}>Lưu</Button><Button type="button" variant="ghost" onClick={() => setEditingTask(null)}>Hủy</Button></div>
              </form> : <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><h2 className="text-lg font-semibold text-foreground">{task.title}</h2>{task.description ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted"><LinkedText>{task.description}</LinkedText></p> : null}</div>
                  {isOwner ? <div className="flex gap-1"><IconButton label="Chỉnh sửa công việc" onClick={() => setEditingTask(task.id)}><Pencil className="h-4 w-4" /></IconButton><IconButton label="Xóa công việc" danger disabled={Boolean(saving)} onClick={() => void deleteTask(task)}><Trash2 className="h-4 w-4" /></IconButton></div> : null}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-muted">Hạn: {dateLabel(task.targetDate)}</span>
                  {isOwner ? <label className="flex items-center gap-2 text-muted">Trạng thái<select value={task.status} disabled={saving === `status-${task.id}`} onChange={(event) => void changeStatus(task, event.target.value as Task["status"])} className="min-h-9 rounded-md border border-border bg-surface px-2 text-sm text-foreground"><option value="in_progress">Đang làm</option><option value="blocked">Đang vướng</option><option value="completed">Hoàn thành</option></select></label> : <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${task.status === "completed" ? "bg-emerald-50 text-emerald-700" : task.status === "blocked" ? "bg-red-50 text-red-700" : "bg-sky-50 text-sky-700"}`}>{statusLabels[task.status]}</span>}
                </div>
              </>}
              <div className="mt-5 border-t border-border pt-4"><span className="inline-flex items-center gap-1.5 text-sm text-muted"><MessageCircle className="h-4 w-4" />{comments.length ? `${comments.length} ghi chú` : "Chưa có ghi chú"}</span></div>
            </article>
            <div className="border-t border-border bg-surface-muted/40 p-5">
              <div className="grid gap-3">
                {comments.map((comment) => {
                  const editable = isOwner || comment.authorUid === data.viewer.uid;
                  const author = comment.authorMemberId ? memberNames.get(comment.authorMemberId) ?? "Thành viên" : "Thầy";
                  return <div key={comment.id} className="rounded-md border border-border bg-surface p-3">
                    {editingComment === comment.id ? <form className="grid gap-2" onSubmit={(event) => void updateComment(comment, event)}><Textarea name="body" defaultValue={comment.body} required maxLength={4000} /><div className="flex gap-2"><Button type="submit" disabled={saving === `edit-comment-${comment.id}`}>Lưu</Button><Button type="button" variant="ghost" onClick={() => setEditingComment(null)}>Hủy</Button></div></form> : <div className="flex gap-3"><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-foreground">{author}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground"><LinkedText>{comment.body}</LinkedText></p></div>{editable ? <div className="flex gap-1"><IconButton label="Chỉnh sửa ghi chú" onClick={() => setEditingComment(comment.id)}><Pencil className="h-4 w-4" /></IconButton><IconButton label="Xóa ghi chú" danger onClick={() => void deleteComment(comment)}><Trash2 className="h-4 w-4" /></IconButton></div> : null}</div>}
                  </div>;
                })}
              </div>
              <form className="mt-4 grid gap-2" onSubmit={(event) => void createComment(task, event)}><label className="text-sm font-medium text-foreground" htmlFor={`comment-${task.id}`}>Ghi chú</label><Textarea id={`comment-${task.id}`} name="body" required maxLength={4000} placeholder="Trao đổi, cập nhật hoặc dán liên kết tài liệu..." /><div><Button type="submit" disabled={saving === `comment-${task.id}`}><MessageCircle className="h-4 w-4" />{saving === `comment-${task.id}` ? "Đang gửi..." : "Gửi ghi chú"}</Button></div></form>
            </div>
          </Card>;
        }) : <Card><p className="py-10 text-center text-sm text-muted">Wall chưa có công việc.</p></Card>}
      </div>
    </div>
  );
}

function IconButton({ label, danger = false, children, ...props }: ComponentPropsWithoutRef<"button"> & { label: string; danger?: boolean }) {
  return <button type="button" title={label} aria-label={label} className={`grid h-9 w-9 place-items-center rounded-md ${danger ? "text-red-700 hover:bg-red-50" : "text-muted hover:bg-surface-muted hover:text-foreground"}`} {...props}>{children}</button>;
}
