"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { api } from "@/lib/api/client";

interface Run {
  trigger: string;
  createdAt: string;
  postId: string | null;
  error: string | null;
}

/** Runs the daily desk now: fetch the feeds and write one post into the review queue. */
export function RunDesk({ hasAi }: { hasAi: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <div className="grid gap-2">
      <button
        type="button"
        className="btn btn-ink btn-sm w-fit"
        disabled={busy}
        onClick={async () => {
          if (hasAi && !confirm("Fetch the feeds and write a new post now? It goes to the review queue, not straight to the site.")) return;
          setBusy(true);
          setMsg(null);
          try {
            const { startedAt } = await api<{ startedAt: string }>("/admin/desk", { method: "POST" });
            // the run continues on the server; wait for its record (at most ~5 minutes)
            let r: Run | undefined;
            for (let i = 0; i < 64 && !r; i++) {
              await new Promise((ok) => setTimeout(ok, 5000));
              const status = await api<{ runs: Run[] }>("/admin/desk").catch(() => null);
              r = status?.runs.find((x) => x.trigger === "manual" && new Date(x.createdAt) >= new Date(startedAt));
            }
            if (!r) setMsg({ ok: false, text: "Still running or stopped without a result. Reload this page in a minute." });
            else setMsg(r.postId ? { ok: true, text: "Done. The new post is waiting in Posts → Waiting for review." } : { ok: !r.error, text: r.error ?? "Feeds fetched." });
            router.refresh();
          } catch (e) {
            setMsg({ ok: false, text: (e as Error).message });
          } finally {
            setBusy(false);
          }
        }}
      >
        <Sparkles size={15} aria-hidden /> {busy ? "Working… (up to a few minutes)" : hasAi ? "Fetch and write now" : "Fetch feeds now"}
      </button>
      {msg && <p className={msg.ok ? "success" : "error"}>{msg.text}</p>}
    </div>
  );
}
