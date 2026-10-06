"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Undo2 } from "lucide-react";
import { api } from "@/lib/api/client";

/** Approve (publishes today) or send back with a note; the author gets an email either way. */
export function ReviewActions({ id, author }: { id: string; author: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function decide(decision: "approve" | "reject") {
    if (decision === "reject" && !note.trim()) {
      setOpen(true);
      setErr(`Write ${author} a note saying what to change.`);
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await api(`/news/${id}/review`, { method: "POST", body: { decision, note } });
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid w-full gap-2">
      {open && (
        <label className="label">
          Note to {author} <span className="hint">required to send back; optional when approving (e.g. a thank-you)</span>
          <textarea className="field min-h-0!" rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} autoFocus />
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-xs" style={{ "--c": "var(--color-lime)" } as React.CSSProperties} disabled={busy} onClick={() => decide("approve")}>
          <Check size={12} aria-hidden /> Approve and publish
        </button>
        <button type="button" className="btn btn-xs" disabled={busy} onClick={() => (open ? decide("reject") : setOpen(true))}>
          <Undo2 size={12} aria-hidden /> {open ? "Send back with this note" : "Send back…"}
        </button>
        {!open && (
          <button type="button" className="btn btn-xs" onClick={() => setOpen(true)}>
            Add a note
          </button>
        )}
      </div>
      {err && <p className="error">{err}</p>}
    </div>
  );
}
