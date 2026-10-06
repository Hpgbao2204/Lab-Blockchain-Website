"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Archive, Pencil, RotateCcw, Trash2, UserPlus, X } from "lucide-react";
import { api } from "@/lib/api/client";

type Role = "lead" | "member";

export interface EditableGroup {
  id: string;
  name: string;
  paperTitle: string | null;
  targetVenue: string | null;
  submissionDeadline: string | null;
  description: string | null;
  status: "active" | "archived";
  members: { id: string; role: Role }[];
}

/**
 * Everything an admin changes about a group in one place: name and paper details, who is in it
 * (add, remove, lead or member), archive, and delete for good.
 */
export function GroupSettings({ group, people, afterDelete, label = "Edit group" }: { group: EditableGroup; people: { id: string; name: string; active: boolean }[]; afterDelete?: string; label?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const names = new Map(people.map((p) => [p.id, p.name]));
  const outside = people.filter((p) => p.active && !group.members.some((m) => m.id === p.id));

  const run = async (fn: () => Promise<unknown>, done: string) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      setMsg({ ok: true, text: done });
      router.refresh();
      return true;
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const saveMembers = (members: { id: string; role: Role }[], done: string) =>
    run(() => api(`/admin/groups/${group.id}/members`, { method: "PUT", body: { members: members.map((m) => ({ userId: m.id, role: m.role })) } }), done);

  return (
    <div className="grid gap-3">
      <button type="button" className="btn btn-sm w-fit" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <Pencil size={14} aria-hidden /> {open ? "Close" : label}
      </button>
      {open && (
        <div className="grid gap-4 rounded-xl border-2 border-dashed border-ink p-4 text-left">
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              run(
                () =>
                  api(`/admin/groups/${group.id}`, {
                    method: "PATCH",
                    body: {
                      name: f.get("name"),
                      paperTitle: f.get("paperTitle"),
                      targetVenue: f.get("targetVenue"),
                      submissionDeadline: f.get("submissionDeadline") || null,
                      description: f.get("description"),
                    },
                  }),
                "Group details saved.",
              );
            }}
          >
            <label className="label">
              Group name
              <input className="field field-sm" name="name" defaultValue={group.name} required maxLength={120} />
            </label>
            <label className="label">
              Paper title <span className="hint">optional</span>
              <input className="field field-sm" name="paperTitle" defaultValue={group.paperTitle ?? ""} maxLength={300} />
            </label>
            <label className="label">
              Target venue <span className="hint">optional</span>
              <input className="field field-sm" name="targetVenue" defaultValue={group.targetVenue ?? ""} maxLength={200} />
            </label>
            <label className="label">
              Submission deadline <span className="hint">optional</span>
              <input className="field field-sm" name="submissionDeadline" type="date" defaultValue={group.submissionDeadline ?? ""} />
            </label>
            <label className="label md:col-span-2">
              Description <span className="hint">optional</span>
              <textarea className="field field-sm" name="description" defaultValue={group.description ?? ""} maxLength={2000} />
            </label>
            <button className="btn btn-ink btn-sm w-fit" type="submit" disabled={busy}>
              Save details
            </button>
          </form>

          <fieldset className="grid gap-2">
            <legend className="label mb-1">Members ({group.members.length})</legend>
            {group.members.length === 0 && <p className="text-sm text-muted">Nobody yet. Add the students who work on this paper.</p>}
            <ul className="grid gap-1.5">
              {group.members.map((m) => {
                const name = names.get(m.id) ?? "Unknown account";
                return (
                  <li key={m.id} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="min-w-0 flex-1 font-medium">{name}</span>
                    <select
                      className="field field-sm w-auto!"
                      aria-label={`Role of ${name}`}
                      value={m.role}
                      disabled={busy}
                      onChange={(e) =>
                        saveMembers(
                          group.members.map((x) => (x.id === m.id ? { ...x, role: e.target.value as Role } : x)),
                          `${name} is now ${e.target.value === "lead" ? "a lead" : "a member"}.`,
                        )
                      }
                    >
                      <option value="member">member</option>
                      <option value="lead">lead</option>
                    </select>
                    <button
                      type="button"
                      className="btn btn-xs"
                      disabled={busy}
                      aria-label={`Remove ${name} from the group`}
                      onClick={() => confirm(`Remove ${name} from ${group.name}? Their account stays; they just stop seeing this wall.`) && saveMembers(group.members.filter((x) => x.id !== m.id), `${name} removed.`)}
                    >
                      <X size={12} aria-hidden /> Remove
                    </button>
                  </li>
                );
              })}
            </ul>
            {outside.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <select className="field field-sm w-auto!" aria-label="Account to add" value={adding} onChange={(e) => setAdding(e.target.value)}>
                  <option value="">Choose an account…</option>
                  {outside.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-xs"
                  disabled={busy || !adding}
                  onClick={async () => {
                    if (await saveMembers([...group.members, { id: adding, role: "member" }], `${names.get(adding)} added.`)) setAdding("");
                  }}
                >
                  <UserPlus size={12} aria-hidden /> Add
                </button>
              </div>
            )}
          </fieldset>

          <div className="grid gap-2 border-t-2 border-dashed border-ink pt-3">
            <p className="label">Archive or delete</p>
            <p className="text-sm text-ink-2">Archiving hides the group from members&apos; dashboards and keeps everything. Deleting removes its tasks, wall posts, links and files for good.</p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="btn btn-xs"
                disabled={busy}
                onClick={() => run(() => api(`/admin/groups/${group.id}`, { method: "PATCH", body: { status: group.status === "active" ? "archived" : "active" } }), group.status === "active" ? "Group archived." : "Group restored.")}
              >
                {group.status === "active" ? <Archive size={12} aria-hidden /> : <RotateCcw size={12} aria-hidden />} {group.status === "active" ? "Archive" : "Restore"}
              </button>
            </div>
            <label className="label">
              Type the group name to delete it <span className="hint">{group.name}</span>
              <input className="field field-sm" value={confirmName} onChange={(e) => setConfirmName(e.target.value)} autoComplete="off" />
            </label>
            <button
              type="button"
              className="btn btn-xs w-fit"
              style={{ "--c": "var(--color-red)" } as React.CSSProperties}
              disabled={busy || confirmName.trim() !== group.name.trim()}
              onClick={async () => {
                setBusy(true);
                setMsg(null);
                try {
                  await api(`/admin/groups/${group.id}`, { method: "DELETE" });
                  if (afterDelete) router.push(afterDelete);
                  router.refresh();
                } catch (e) {
                  setMsg({ ok: false, text: (e as Error).message });
                  setBusy(false);
                }
              }}
            >
              <Trash2 size={12} aria-hidden /> Delete group for good
            </button>
          </div>
          {msg && (
            <p className={msg.ok ? "success" : "error"} role="status">
              {msg.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
