"use client";

import { ComponentPropsWithoutRef, FormEvent, ReactNode, useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { WallFeed } from "@/components/walls/wall-feed";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ToastContainer, useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { Team } from "@/types/content";

type Member = { id: string; name: string; role: string; isActive: boolean };
type ManagedAccount = { memberId?: string | null; role: "owner" | "admin" | "member"; status: "active" | "inactive" | "pending" };
type Props = { getHeaders: () => Promise<HeadersInit | null>; onForbidden: () => void; notify?: (message: string, type?: "success" | "error") => void; selectedWallSlug?: string; onClearSelectedWall?: () => void };

async function messageFor(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  return typeof body?.error === "string" ? body.error : fallback;
}

function EditorPanel({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div className="fixed inset-0 z-[70] flex justify-end bg-secondary/30 sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
    <button type="button" aria-label="Đóng" className="absolute inset-0 cursor-default" onClick={onClose} />
    <aside className="relative h-full w-full max-w-xl overflow-y-auto bg-surface shadow-2xl sm:rounded-lg"><header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-5 py-4"><h2 className="text-lg font-semibold text-foreground">{title}</h2><IconButton label="Đóng" onClick={onClose}><X className="h-5 w-5" /></IconButton></header><div className="p-5">{children}</div></aside>
  </div>;
}

export function TeamTaskManager({ getHeaders, onForbidden, notify, selectedWallSlug, onClearSelectedWall }: Props) {
  const fallbackToast = useToast();
  const showToast = notify ?? fallbackToast.show;
  const [members, setMembers] = useState<Member[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editor, setEditor] = useState<Team | "new" | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const headers = await getHeaders();
    if (!headers) return;
    setLoading(true);
    setMessage("");
    try {
      const [membersResponse, accountsResponse, teamsResponse] = await Promise.all([fetch("/api/admin/members", { headers }), fetch("/api/admin/users", { headers }), fetch("/api/admin/teams", { headers })]);
      if ([membersResponse, accountsResponse, teamsResponse].some((response) => response.status === 401 || response.status === 403)) return onForbidden();
      if (!membersResponse.ok || !accountsResponse.ok || !teamsResponse.ok) throw new Error("Không thể tải dữ liệu Wall.");
      const [membersBody, accountsBody, teamsBody] = await Promise.all([membersResponse.json(), accountsResponse.json(), teamsResponse.json()]);
      const activeMemberIds = new Set((Array.isArray(accountsBody.data) ? accountsBody.data as ManagedAccount[] : []).flatMap((account) => account.role === "member" && account.status === "active" && account.memberId ? [account.memberId] : []));
      setMembers((Array.isArray(membersBody.data) ? membersBody.data : []).map((member: Omit<Member, "isActive">) => ({ ...member, isActive: activeMemberIds.has(member.id) })));
      setTeams(Array.isArray(teamsBody.data) ? teamsBody.data : []);
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Không thể tải dữ liệu Wall.";
      setMessage(nextMessage);
      showToast(nextMessage, "error");
    } finally {
      setLoading(false);
    }
  }, [getHeaders, onForbidden, showToast]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!selectedWallSlug) return;
    const selected = teams.find((team) => team.slug === selectedWallSlug);
    if (selected) setSelectedTeamId(selected.id);
  }, [selectedWallSlug, teams]);

  async function saveTeam(payload: Pick<Team, "name" | "slug" | "description" | "memberIds" | "isActive">, team?: Team) {
    const headers = await getHeaders();
    if (!headers) return "Không có phiên đăng nhập.";
    const response = await fetch(team ? `/api/admin/teams/${team.id}` : "/api/admin/teams", { method: team ? "PATCH" : "POST", headers, body: JSON.stringify(payload) });
    if (response.status === 401 || response.status === 403) {
      onForbidden();
      return "Không có quyền quản lý Wall.";
    }
    if (!response.ok) return messageFor(response, "Không thể lưu Wall.");
    const body = await response.json();
    setEditor(null);
    if (!team && typeof body.data?.id === "string") setSelectedTeamId(body.data.id);
    showToast(team ? "Đã cập nhật Wall." : "Đã tạo Wall.");
    await load();
    return null;
  }

  async function deleteTeam(team: Team) {
    if (!window.confirm(`Lưu trữ Wall “${team.name}”?`)) return;
    const headers = await getHeaders();
    if (!headers) return;
    const response = await fetch(`/api/admin/teams/${team.id}`, { method: "DELETE", headers });
    if (response.status === 401 || response.status === 403) return onForbidden();
    if (!response.ok) return showToast(await messageFor(response, "Không thể lưu trữ Wall."), "error");
    setSelectedTeamId(null);
    showToast("Đã lưu trữ Wall.");
    await load();
  }

  const selectedTeam = teams.find((team) => team.id === selectedTeamId);

  return <div className="grid gap-6">
    {!notify ? <ToastContainer toasts={fallbackToast.toasts} onDismiss={fallbackToast.dismiss} /> : null}
    {selectedTeam ? <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <Button type="button" variant="secondary" onClick={() => { setSelectedTeamId(null); onClearSelectedWall?.(); }}><ArrowLeft className="h-4 w-4" />Tất cả Wall</Button>
      <Button type="button" variant="ghost" onClick={() => void deleteTeam(selectedTeam)}><Trash2 className="h-4 w-4" />Lưu trữ Wall</Button>
    </div> : <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-primary">Quản trị lab</p><h1 className="mt-2 text-2xl font-semibold text-foreground">Quản lý Wall</h1><p className="mt-2 text-sm leading-6 text-muted">Tạo Wall, phân thành viên và mở feed công việc.</p></div>
      <div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" onClick={() => void load()} disabled={loading}><RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />Làm mới</Button><Button type="button" onClick={() => setEditor("new")}><Plus className="h-4 w-4" />Tạo Wall</Button></div>
    </header>}
    {message ? <p className="text-sm text-red-700">{message}</p> : null}
    {loading ? <Card><p className="py-12 text-center text-sm text-muted">Đang tải...</p></Card> : selectedTeam ? <WallFeed slug={selectedTeam.slug} getHeaders={getHeaders} onForbidden={onForbidden} onManageWall={setEditor} notify={showToast} /> : <WallsList teams={teams} members={members} onView={setSelectedTeamId} onEdit={setEditor} onDelete={deleteTeam} />}
    {editor ? <EditorPanel title={editor === "new" ? "Tạo Wall" : "Quản lý Wall"} onClose={() => setEditor(null)}><TeamForm team={editor === "new" ? undefined : editor} members={members} onSubmit={saveTeam} /></EditorPanel> : null}
  </div>;
}

function WallsList({ teams, members, onView, onEdit, onDelete }: { teams: Team[]; members: Member[]; onView: (id: string) => void; onEdit: (team: Team) => void; onDelete: (team: Team) => void }) {
  if (!teams.length) return <Card><p className="py-12 text-center text-sm text-muted">Chưa có Wall nào.</p></Card>;
  const activeMembers = new Set(members.filter((member) => member.isActive).map((member) => member.id));
  return <Card className="p-0"><div className="divide-y divide-border">{teams.map((team) => <div key={team.id} className="flex flex-wrap items-center justify-between gap-4 p-5"><button type="button" className="min-w-0 text-left hover:text-primary" onClick={() => onView(team.id)}><p className="font-semibold text-foreground">{team.name}</p><p className="mt-1 max-w-2xl text-sm text-muted">{team.description || "Chưa có mô tả."}</p><p className="mt-2 text-xs text-muted">{team.memberIds.filter((id) => activeMembers.has(id)).length} thành viên đang hoạt động</p></button><div className="flex gap-1"><IconButton label="Mở Wall" onClick={() => onView(team.id)}><ArrowRight className="h-4 w-4" /></IconButton><IconButton label="Quản lý Wall" onClick={() => onEdit(team)}><Pencil className="h-4 w-4" /></IconButton><IconButton label="Lưu trữ Wall" danger onClick={() => void onDelete(team)}><Trash2 className="h-4 w-4" /></IconButton></div></div>)}</div></Card>;
}

function TeamForm({ team, members, onSubmit }: { team?: Team; members: Member[]; onSubmit: (payload: Pick<Team, "name" | "slug" | "description" | "memberIds" | "isActive">, team?: Team) => Promise<string | null> }) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const memberIds = form.getAll("memberIds").map(String);
    if (!memberIds.length) return setError("Wall cần ít nhất một thành viên đang hoạt động.");
    setSaving(true);
    setError("");
    const nextError = await onSubmit({ name: String(form.get("name") ?? ""), slug: String(form.get("slug") ?? ""), description: String(form.get("description") ?? "") || undefined, memberIds, isActive: form.get("isActive") === "on" }, team);
    if (nextError) { setError(nextError); setSaving(false); }
  }
  return <form className="grid gap-4" onSubmit={submit}>{error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}<label className="grid gap-1 text-sm font-medium text-foreground">Tên Wall<Input name="name" defaultValue={team?.name} required /></label><label className="grid gap-1 text-sm font-medium text-foreground">Slug<Input name="slug" defaultValue={team?.slug} placeholder="research-wall" required /></label><label className="grid gap-1 text-sm font-medium text-foreground">Mô tả<Textarea name="description" defaultValue={team?.description} /></label><label className="flex items-center gap-2 text-sm font-medium text-foreground"><input name="isActive" type="checkbox" defaultChecked={team?.isActive ?? true} />Đang hoạt động</label><fieldset className="grid gap-2"><legend className="text-sm font-medium text-foreground">Thành viên</legend><p className="text-xs text-muted">Chỉ thành viên đang hoạt động có thể được thêm vào Wall.</p><div className="grid max-h-64 gap-1 overflow-y-auto rounded-md border border-border p-3">{members.filter((member) => member.isActive).map((member) => <label key={member.id} className="flex items-center gap-2 rounded px-2 py-2 text-sm text-foreground hover:bg-surface-muted"><input name="memberIds" type="checkbox" value={member.id} defaultChecked={team?.memberIds.includes(member.id)} />{member.name}<span className="text-xs text-muted">({member.role})</span></label>)}{!members.some((member) => member.isActive) ? <p className="text-sm text-amber-800">Chưa có thành viên đang hoạt động. Hãy kích hoạt hoặc cấp tài khoản trước.</p> : null}</div></fieldset><Button type="submit" disabled={saving}><Check className="h-4 w-4" />{saving ? "Đang lưu..." : "Lưu Wall"}</Button></form>;
}

function IconButton({ label, danger = false, children, ...props }: ComponentPropsWithoutRef<"button"> & { label: string; danger?: boolean }) {
  return <button type="button" title={label} aria-label={label} className={cn("grid h-10 w-10 place-items-center rounded-md text-muted hover:bg-surface-muted hover:text-foreground", danger && "text-red-600 hover:bg-red-50 hover:text-red-700")} {...props}>{children}</button>;
}
