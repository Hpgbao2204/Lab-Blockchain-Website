"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarClock, MessageSquare, Paperclip, Plus, Target, Trash2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { addDays, bucketFor, formatDay, formatStamp, weekStart, type WeekBucket } from "@/lib/weeks";
import { Initials } from "./initials";
import { AddResource, Resources, type WallFile, type WallLink } from "./resources";

export interface BoardTask {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  priority: "low" | "normal" | "high";
  venue: string | null;
  status: "todo" | "doing" | "review" | "done";
  assignees: { id: string; name: string }[];
  commentCount: number;
}
interface Member {
  id: string;
  name: string;
  role: "lead" | "member";
}
interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string };
}

const COLUMNS: { key: WeekBucket[]; label: string; c: string }[] = [
  { key: ["overdue", "this-week"], label: "This week", c: "var(--color-yellow)" },
  { key: ["next-week"], label: "Next week", c: "var(--color-blue)" },
  { key: ["later"], label: "Later", c: "var(--color-violet)" },
  { key: ["done"], label: "Done", c: "var(--color-teal)" },
];
const PRIORITY = { high: "var(--color-red)", normal: "var(--color-yellow)", low: "var(--color-line)" };
const STATUS_BG = { todo: "var(--color-paper-2)", doing: "var(--color-blue)", review: "var(--color-orange)", done: "var(--color-teal)" };

interface BoardProps {
  groupId: string;
  tasks: BoardTask[];
  members: Member[];
  me: string;
  canManage: boolean;
  today: string;
  targetVenue: string | null;
  links: WallLink[];
  files: WallFile[];
}

export function TaskBoard(props: BoardProps) {
  const { tasks, today } = props;
  const [creating, setCreating] = useState(false);
  const start = weekStart(today);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="mono text-xs text-muted">
          Week of {formatDay(start)} – {formatDay(addDays(start, 6))}
        </p>
        {props.canManage && (
          <button type="button" className="btn btn-yellow btn-sm ml-auto" onClick={() => setCreating((v) => !v)} aria-expanded={creating}>
            <Plus size={16} aria-hidden /> New task
          </button>
        )}
      </div>
      {creating && <NewTask {...props} onDone={() => setCreating(false)} />}
      <div className="board">
        {COLUMNS.map((col) => {
          const items = tasks.filter((t) => col.key.includes(bucketFor(t, today)));
          return (
            <section key={col.label} className="col" style={{ "--c": col.c } as React.CSSProperties} aria-label={col.label}>
              <div className="col-head">
                {col.label} <small>{items.length}</small>
              </div>
              {items.map((t) => (
                <TaskCard key={t.id} task={t} {...props} />
              ))}
              {!items.length && <p className="mono text-xs text-ink-2">Nothing here.</p>}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function TaskCard({ task, me, canManage, today, groupId, links, files }: BoardProps & { task: BoardTask }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [attach, setAttach] = useState(false);
  const myLinks = links.filter((l) => l.taskId === task.id);
  const myFiles = files.filter((f) => f.taskId === task.id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canMove = canManage || !task.assignees.length || task.assignees.some((a) => a.id === me);
  const overdue = bucketFor(task, today) === "overdue";

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      await api(`/tasks/${task.id}`, { method: "PATCH", body });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article id={`task-${task.id}`} className="task" style={{ "--p": PRIORITY[task.priority] } as React.CSSProperties}>
      <h4>{task.title}</h4>
      {task.description && <p className="text-sm text-ink-2">{task.description}</p>}
      <div className="meta">
        <CalendarClock size={14} aria-hidden />
        <span className={overdue ? "font-bold text-red" : ""}>{overdue ? `Overdue · ${formatDay(task.dueDate)}` : formatDay(task.dueDate)}</span>
        {task.priority !== "normal" && <span>· {task.priority}</span>}
      </div>
      {task.venue && (
        <p>
          <span className="venue" title="Target venue">
            <Target size={12} aria-hidden /> {task.venue}
          </span>
        </p>
      )}
      <Resources links={myLinks} files={myFiles} me={me} canManage={canManage} small />
      <div className="flex items-center gap-2">
        {task.assignees.length ? (
          <span className="avatars">
            {task.assignees.map((a) => (
              <Initials key={a.id} name={a.name} />
            ))}
          </span>
        ) : (
          <span className="mono text-xs text-muted">whole group</span>
        )}
        <label className="ml-auto">
          <span className="sr-only">Status</span>
          <select
            className="status"
            style={{ "--s": STATUS_BG[task.status] } as React.CSSProperties}
            value={task.status}
            disabled={!canMove || busy}
            onChange={(e) => patch({ status: e.target.value })}
          >
            <option value="todo">todo</option>
            <option value="doing">doing</option>
            <option value="review">review</option>
            <option value="done">done</option>
          </select>
        </label>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" className="mono flex items-center gap-1 text-xs underline-offset-2 hover:underline" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <MessageSquare size={13} aria-hidden /> {task.commentCount} comment{task.commentCount === 1 ? "" : "s"}
        </button>
        {canMove && (
          <button type="button" className="mono flex items-center gap-1 text-xs underline-offset-2 hover:underline" onClick={() => setAttach((v) => !v)} aria-expanded={attach}>
            <Paperclip size={13} aria-hidden /> attach
          </button>
        )}
        {canManage && (
          <button
            type="button"
            className="ml-auto text-muted hover:text-red"
            aria-label="Delete task"
            onClick={async () => {
              if (!confirm(`Delete "${task.title}"?`)) return;
              await api(`/tasks/${task.id}`, { method: "DELETE" }).catch((e) => setError(e.message));
              router.refresh();
            }}
          >
            <Trash2 size={15} aria-hidden />
          </button>
        )}
      </div>
      {attach && <AddResource groupId={groupId} taskId={task.id} small />}
      {error && <p className="error">{error}</p>}
      {open && <Comments taskId={task.id} />}
    </article>
  );
}

function Comments({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [items, setItems] = useState<Comment[] | null>(null);
  const [reload, setReload] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    api<Comment[]>(`/tasks/${taskId}/comments`)
      .then((rows) => live && setItems(rows))
      .catch((e) => live && (setItems([]), setError(e.message)));
    return () => {
      live = false;
    };
  }, [taskId, reload]);

  return (
    <div className="grid gap-2 border-t-2 border-dashed border-ink pt-2">
      {items === null && <p className="mono text-xs">loading…</p>}
      {items?.map((c) => (
        <div key={c.id} className="flex gap-2 text-sm">
          <Initials name={c.author.name} />
          <p>
            <b>{c.author.name}</b> <span className="mono text-[11px] text-muted">{formatStamp(c.createdAt)}</span>
            <br />
            {c.body}
          </p>
        </div>
      ))}
      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!text.trim()) return;
          try {
            await api(`/tasks/${taskId}/comments`, { body: { body: text } });
            setText("");
            setReload((n) => n + 1);
            router.refresh();
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        <input className="field field-sm" value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a comment" aria-label="Comment" />
        <button className="btn btn-ink btn-sm" type="submit">
          Send
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

function NewTask({ groupId, members, today, targetVenue, onDone }: BoardProps & { onDone: () => void }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const friday = addDays(weekStart(today), 4);

  return (
    <form
      className="card grid gap-3 p-4 md:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setBusy(true);
        setError("");
        try {
          await api(`/groups/${groupId}/tasks`, {
            body: {
              title: f.get("title"),
              description: f.get("description"),
              dueDate: f.get("dueDate"),
              priority: f.get("priority"),
              assigneeIds: f.getAll("assignees"),
              venue: f.get("venue"),
              links: [
                { url: f.get("overleaf"), label: "Overleaf", kind: "overleaf" },
                { url: f.get("link"), label: f.get("linkLabel") },
              ].filter((l) => typeof l.url === "string" && l.url.trim()),
            },
          });
          onDone();
          router.refresh();
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="label md:col-span-2">
        Task
        <input className="field" name="title" required maxLength={200} placeholder="e.g. Draft the related-work section" />
      </label>
      <label className="label">
        Due
        <input className="field" name="dueDate" type="date" required defaultValue={friday < today ? addDays(friday, 7) : friday} />
      </label>
      <label className="label">
        Priority
        <select className="field" name="priority" defaultValue="normal">
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
      </label>
      <label className="label md:col-span-2">
        Details <span className="hint">optional</span>
        <textarea className="field" name="description" maxLength={5000} />
      </label>
      <label className="label">
        Submit to <span className="hint">journal or conference</span>
        <input className="field" name="venue" maxLength={200} defaultValue={targetVenue ?? ""} placeholder="e.g. IEEE TDSC, ACM CCS 2027" />
      </label>
      <label className="label">
        Overleaf <span className="hint">optional</span>
        <input className="field" name="overleaf" type="url" placeholder="https://www.overleaf.com/project/…" />
      </label>
      <label className="label">
        Other link <span className="hint">GitHub, Drive, call for papers…</span>
        <input className="field" name="link" type="url" placeholder="https://" />
      </label>
      <label className="label">
        Link label <span className="hint">optional</span>
        <input className="field" name="linkLabel" maxLength={120} placeholder="e.g. Call for papers" />
      </label>
      <fieldset className="label md:col-span-2">
        <legend>
          Assign to <span className="hint">none = whole group</span>
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {members.map((m) => (
            <label key={m.id} className="chip flex items-center gap-2 has-[:checked]:bg-lime">
              <input type="checkbox" name="assignees" value={m.id} className="accent-ink" /> {m.name}
            </label>
          ))}
        </div>
      </fieldset>
      {error && <p className="error md:col-span-2">{error}</p>}
      <div className="flex gap-2 md:col-span-2">
        <button className="btn btn-ink" type="submit" disabled={busy}>
          {busy ? "Saving…" : "Add task"}
        </button>
        <button className="btn" type="button" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}
