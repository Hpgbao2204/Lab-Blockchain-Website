"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, Plus } from "lucide-react";
import { api } from "@/lib/api/client";

interface Person {
  id: string;
  name: string;
  active: boolean;
}
export interface AdminGroup {
  id: string;
  name: string;
  paperTitle: string | null;
  targetVenue: string | null;
  submissionDeadline: string | null;
  status: "active" | "archived";
  memberCount: number;
  openTasks: number;
  members: { id: string; role: "lead" | "member" }[];
}

export function AdminGroups({ groups, people }: { groups: AdminGroup[]; people: Person[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <div className="grid gap-5">
      <div>
        <button type="button" className="btn btn-yellow btn-sm" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <Plus size={15} aria-hidden /> New group
        </button>
      </div>
      {open && (
        <form
          className="card grid gap-3 p-4 md:grid-cols-2"
          style={{ boxShadow: "var(--shadow)" }}
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setError("");
            try {
              await api("/admin/groups", {
                body: {
                  name: f.get("name"),
                  paperTitle: f.get("paperTitle"),
                  targetVenue: f.get("targetVenue"),
                  submissionDeadline: f.get("submissionDeadline") || null,
                  description: f.get("description"),
                },
              });
              setOpen(false);
              router.refresh();
            } catch (err) {
              setError((err as Error).message);
            }
          }}
        >
          <label className="label">
            Group name
            <input className="field field-sm" name="name" required maxLength={120} placeholder="e.g. zk-HTLC journal extension" />
          </label>
          <label className="label">
            Paper title <span className="hint">optional</span>
            <input className="field field-sm" name="paperTitle" maxLength={300} />
          </label>
          <label className="label">
            Target venue <span className="hint">optional</span>
            <input className="field field-sm" name="targetVenue" maxLength={200} placeholder="e.g. Computer Networks" />
          </label>
          <label className="label">
            Submission deadline <span className="hint">optional</span>
            <input className="field field-sm" name="submissionDeadline" type="date" />
          </label>
          <label className="label md:col-span-2">
            Description <span className="hint">optional</span>
            <textarea className="field" name="description" maxLength={2000} />
          </label>
          <button className="btn btn-ink btn-sm w-fit" type="submit">
            Create group
          </button>
        </form>
      )}
      {error && <p className="error">{error}</p>}
      <ul className="grid gap-4 md:grid-cols-2">
        {groups.map((g) => (
          <GroupCard key={g.id} group={g} people={people} />
        ))}
      </ul>
      {!groups.length && <p className="note"><b>Empty</b><span>No groups yet. Create one for each paper or monthly team.</span></p>}
    </div>
  );
}

function GroupCard({ group, people }: { group: AdminGroup; people: Person[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [sel, setSel] = useState(() => new Map(group.members.map((m) => [m.id, m.role])));
  const [error, setError] = useState("");

  const toggle = (id: string) =>
    setSel((prev) => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, "member");
      return next;
    });

  return (
    <li className="card grid gap-3 p-4" style={{ boxShadow: "var(--shadow)", opacity: group.status === "archived" ? 0.6 : 1 }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold [font-family:var(--font-display)]">{group.name}</h3>
          {group.paperTitle && <p className="text-sm text-ink-2">{group.paperTitle}</p>}
          <p className="mono text-xs text-muted">
            {group.memberCount} members · {group.openTasks} open tasks · {group.status}
          </p>
        </div>
        <Link href={`/app/groups/${group.id}`} className="btn btn-sm">
          Wall <ArrowUpRight size={14} aria-hidden />
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-sm" onClick={() => setEditing((v) => !v)} aria-expanded={editing}>
          Members
        </button>
        <button
          type="button"
          className="btn btn-sm"
          onClick={async () => {
            await api(`/admin/groups/${group.id}`, { method: "PATCH", body: { status: group.status === "active" ? "archived" : "active" } }).catch((e) => setError(e.message));
            router.refresh();
          }}
        >
          {group.status === "active" ? "Archive" : "Restore"}
        </button>
      </div>
      {editing && (
        <div className="grid gap-2">
          <ul className="grid gap-1.5">
            {people
              .filter((p) => p.active)
              .map((p) => (
                <li key={p.id} className="flex items-center gap-2 text-sm">
                  <label className="flex flex-1 items-center gap-2">
                    <input type="checkbox" checked={sel.has(p.id)} onChange={() => toggle(p.id)} className="accent-ink" />
                    {p.name}
                  </label>
                  {sel.has(p.id) && (
                    <select
                      className="field field-sm w-auto!"
                      aria-label={`Role of ${p.name} in group`}
                      value={sel.get(p.id)}
                      onChange={(e) => setSel((prev) => new Map(prev).set(p.id, e.target.value as "lead" | "member"))}
                    >
                      <option value="member">member</option>
                      <option value="lead">lead</option>
                    </select>
                  )}
                </li>
              ))}
          </ul>
          <button
            type="button"
            className="btn btn-ink btn-sm w-fit"
            onClick={async () => {
              setError("");
              try {
                await api(`/admin/groups/${group.id}/members`, { method: "PUT", body: { members: [...sel].map(([userId, role]) => ({ userId, role })) } });
                setEditing(false);
                router.refresh();
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Save members
          </button>
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </li>
  );
}
