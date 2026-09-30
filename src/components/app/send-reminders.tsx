"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { api } from "@/lib/api/client";

export function SendReminders({ enabled, count }: { enabled: boolean; count: number }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <div className="grid gap-2">
      <button
        type="button"
        className="btn btn-ink btn-sm w-fit"
        disabled={!enabled || !count || busy}
        onClick={async () => {
          if (!confirm(`Send ${count} reminder email${count === 1 ? "" : "s"} now?`)) return;
          setBusy(true);
          try {
            const r = await api<{ sent: number; recipients: number }>("/admin/digest", { method: "POST" });
            setMsg({ ok: r.sent === r.recipients, text: `Sent ${r.sent} of ${r.recipients}.` });
          } catch (e) {
            setMsg({ ok: false, text: (e as Error).message });
          } finally {
            setBusy(false);
          }
        }}
      >
        <Send size={15} aria-hidden /> {busy ? "Sending…" : "Send now"}
      </button>
      {msg && <p className={msg.ok ? "success" : "error"}>{msg.text}</p>}
    </div>
  );
}
