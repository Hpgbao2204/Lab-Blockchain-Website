"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Mail, Pencil, RefreshCw, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ToastContainer, useToast } from "@/components/ui/toast";
import { getAdminCopy } from "@/components/admin/admin-copy";
import { useTranslation } from "@/components/i18n/locale-provider";

type ManagedUser = {
  id: string;
  uid: string;
  email: string;
  role: "owner" | "admin" | "member";
  status: "active" | "inactive" | "pending";
  memberId?: string | null;
};

type MemberOption = { id: string; name: string; slug: string; role: string };

type AccountManagerProps = {
  getHeaders: () => Promise<HeadersInit | null>;
  onForbidden: () => void;
  notify?: (message: string, type?: "success" | "error") => void;
};

async function responseMessage(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  return typeof body?.error === "string" ? body.error : fallback;
}

export function AccountManager({ getHeaders, onForbidden, notify }: AccountManagerProps) {
  const { locale } = useTranslation();
  const text = getAdminCopy(locale);
  const fallbackToast = useToast();
  const showToast = notify ?? fallbackToast.show;

  const [accounts, setAccounts] = useState<ManagedUser[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const headers = await getHeaders();
    if (!headers) return;
    setLoading(true);
    try {
      const [accountsResponse, membersResponse] = await Promise.all([
        fetch("/api/admin/users", { headers }),
        fetch("/api/admin/members", { headers })
      ]);
      if (accountsResponse.status === 403 || membersResponse.status === 403) {
        onForbidden();
        return;
      }
      if (!accountsResponse.ok) throw new Error(await responseMessage(accountsResponse, "Unable to load accounts"));
      if (!membersResponse.ok) throw new Error(await responseMessage(membersResponse, "Unable to load member profiles"));
      const [accountsBody, membersBody] = await Promise.all([accountsResponse.json(), membersResponse.json()]);
      setAccounts(Array.isArray(accountsBody.data) ? accountsBody.data : []);
      setMembers(Array.isArray(membersBody.data) ? membersBody.data : []);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to load accounts", "error");
    } finally {
      setLoading(false);
    }
  }, [getHeaders, onForbidden, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const headers = await getHeaders();
    if (!headers) return;
    const memberId = String(form.get("memberId") ?? "");
    const body = memberId
      ? { email: String(form.get("email") ?? ""), memberId }
      : {
          email: String(form.get("email") ?? ""),
          member: {
            name: String(form.get("memberName") ?? ""),
            slug: String(form.get("memberSlug") ?? ""),
            role: String(form.get("memberRole") ?? "")
          }
        };

    setSaving(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers,
        body: JSON.stringify(body)
      });
      if (response.status === 403) return onForbidden();
      if (!response.ok) throw new Error(await responseMessage(response, "Unable to create account"));
      const payload = await response.json();
      formElement.reset();
      showToast(payload.data?.invitationSent ? text.invitationSent : text.invitationFailed, payload.data?.invitationSent ? "success" : "error");
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to create account", "error");
    } finally {
      setSaving(false);
    }
  }

  async function updateAccount(uid: string, body: Record<string, unknown>) {
    const headers = await getHeaders();
    if (!headers) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${uid}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body)
      });
      if (response.status === 403) return onForbidden();
      if (!response.ok) throw new Error(await responseMessage(response, "Unable to update account"));
      const payload = await response.json();
      if (body.sendReset) {
        showToast(payload.data?.invitationSent ? text.passwordResetSent : text.invitationFailed, payload.data?.invitationSent ? "success" : "error");
      } else if (body.status !== undefined) {
        showToast(body.status === "inactive" ? text.accountDeactivated : text.accountActivated, "success");
      } else {
        showToast(text.accountUpdated, "success");
      }
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to update account", "error");
    } finally {
      setSaving(false);
    }
  }

  async function updateMember(memberId: string, body: Record<string, unknown>): Promise<boolean> {
    const headers = await getHeaders();
    if (!headers) return false;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/members/${memberId}`, { method: "PATCH", headers, body: JSON.stringify(body) });
      if (response.status === 403) {
        onForbidden();
        return false;
      }
      if (!response.ok) throw new Error(await responseMessage(response, "Không thể cập nhật hồ sơ thành viên."));
      showToast("Đã cập nhật thông tin thành viên.", "success");
      await load();
      return true;
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không thể cập nhật hồ sơ thành viên.", "error");
      return false;
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6">
      {!notify ? <ToastContainer toasts={fallbackToast.toasts} onDismiss={fallbackToast.dismiss} /> : null}
      <Card>
        <form onSubmit={createAccount} className="grid gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-primary">{text.workspace}</p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">{text.createAccount}</h2>
            <p className="mt-1 text-sm text-muted">{text.accountDescription}</p>
          </div>
          <label className="grid gap-1 text-sm font-medium text-foreground">
            {text.email}
            <Input name="email" type="email" required />
          </label>
          <label className="grid gap-1 text-sm font-medium text-foreground">
            {text.linkedProfile}
            <select name="memberId" defaultValue="" className="min-h-11 rounded-md border border-border bg-surface px-3 py-2 text-sm">
              <option value="">{text.newProfile}</option>
              {members.filter((member) => !accounts.some((account) => account.memberId === member.id)).map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.role})
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-1 text-sm font-medium text-foreground">
              {text.profileName}
              <Input name="memberName" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-foreground">
              {text.profileSlug}
              <Input name="memberSlug" placeholder="nguyen-van-a" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-foreground">
              {text.researchRole}
              <Input name="memberRole" placeholder="Research member" />
            </label>
          </div>
          <div>
            <Button type="submit" disabled={saving}>
              <UserPlus className="h-4 w-4" />
              {saving ? text.loading : text.createAccount}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{text.accounts}</h2>
            <p className="text-sm text-muted">{accounts.length} {text.provisionedAccounts}</p>
          </div>
          <Button type="button" variant="secondary" onClick={() => void load()} disabled={loading || saving}>
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            {text.refresh}
          </Button>
        </div>
        {loading ? (
          <p className="py-8 text-center text-sm text-muted">{text.loading}</p>
        ) : accounts.length ? (
          <div className="grid gap-3">
            {accounts.map((account) => (
              <AccountRow key={account.uid} account={account} member={members.find((member) => member.id === account.memberId)} saving={saving} onSave={updateAccount} onSaveMember={updateMember} />
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted">{text.noAccounts}</p>
        )}
      </Card>
    </div>
  );
}

function AccountRow({ account, member, saving, onSave, onSaveMember }: { account: ManagedUser; member?: MemberOption; saving: boolean; onSave: (uid: string, body: Record<string, unknown>) => Promise<void>; onSaveMember: (memberId: string, body: Record<string, unknown>) => Promise<boolean> }) {
  const { locale } = useTranslation();
  const text = getAdminCopy(locale);
  const [status, setStatus] = useState(account.status === "pending" ? "inactive" : account.status);
  const [editingProfile, setEditingProfile] = useState(false);

  useEffect(() => {
    setStatus(account.status === "pending" ? "inactive" : account.status);
  }, [account.status]);

  return (
    <div className="grid gap-3 border-b border-border pb-4 last:border-b-0 last:pb-0 md:grid-cols-[1fr_140px_auto] md:items-end">
      <div>
        <p className="font-medium text-foreground">{member?.name ?? account.email}</p>
        {member ? <p className="mt-1 text-xs text-muted">{account.email}</p> : null}
        <p className="text-xs text-muted">{account.role === "owner" ? "Owner" : text.profile + ": " + (account.memberId ?? text.notLinked)}</p>
      </div>
      <label className="grid gap-1 text-xs font-medium text-muted">
        {text.status}
        <select
          value={status}
          disabled={account.role === "owner" || saving}
          onChange={(event) => setStatus(event.target.value as "active" | "inactive")}
          className="min-h-10 rounded-md border border-border bg-surface px-2 py-2 text-sm text-foreground"
        >
          <option value="active">{text.active}</option>
          <option value="inactive">{locale === "vi" ? "Không hoạt động" : "Inactive"}</option>
        </select>
      </label>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={saving || account.role === "owner"}
          onClick={() => void onSave(account.uid, { status })}
        >
          {text.save}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={saving}
          onClick={() => void onSave(account.uid, { sendReset: true })}
        >
          <Mail className="h-4 w-4" />
          {text.resetPassword}
        </Button>
        {member ? <Button type="button" variant="ghost" disabled={saving} onClick={() => setEditingProfile((value) => !value)}><Pencil className="h-4 w-4" />Hồ sơ</Button> : null}
      </div>
      {member && editingProfile ? <MemberEditor member={member} saving={saving} onCancel={() => setEditingProfile(false)} onSave={async (body) => { if (await onSaveMember(member.id, body)) setEditingProfile(false); }} /> : null}
    </div>
  );
}

function MemberEditor({ member, saving, onCancel, onSave }: { member: MemberOption; saving: boolean; onCancel: () => void; onSave: (body: Record<string, unknown>) => Promise<void> }) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onSave({ name: String(form.get("name") ?? ""), slug: String(form.get("slug") ?? ""), role: String(form.get("role") ?? "") });
  }
  return <form className="grid gap-3 border-t border-border pt-3 md:col-span-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end" onSubmit={submit}><label className="grid gap-1 text-xs font-medium text-muted">Tên<Input name="name" defaultValue={member.name} required /></label><label className="grid gap-1 text-xs font-medium text-muted">Slug<Input name="slug" defaultValue={member.slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" /></label><label className="grid gap-1 text-xs font-medium text-muted">Vai trò<Input name="role" defaultValue={member.role} required /></label><div className="flex gap-2"><Button type="submit" disabled={saving}>Lưu</Button><Button type="button" variant="ghost" disabled={saving} onClick={onCancel}>Hủy</Button></div></form>;
}
