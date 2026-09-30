"use client";

import { useState } from "react";
import { Play } from "lucide-react";

const presets = ["/api/v1/stats", "/api/v1/research", "/api/v1/research/cross-chain", "/api/v1/publications?kind=journal&year=2025", "/api/v1/members"];

/** Calls the public API from the browser and shows the raw JSON. */
export function ApiExplorer() {
  const [path, setPath] = useState(presets[0]);
  const [out, setOut] = useState<{ status: number; body: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (p = path) => {
    if (!p.startsWith("/api/v1")) return;
    setBusy(true);
    try {
      const res = await fetch(p);
      const body = JSON.stringify(await res.json(), null, 2);
      setOut({ status: res.status, body: body.length > 4000 ? `${body.slice(0, 4000)}\n…` : body });
    } catch {
      setOut({ status: 0, body: "Request failed." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="window">
      <div className="window-bar">
        <i style={{ "--c": "var(--color-red)" } as React.CSSProperties} />
        <i style={{ "--c": "var(--color-yellow)" } as React.CSSProperties} />
        <i style={{ "--c": "var(--color-lime)" } as React.CSSProperties} />
        <span className="title">try it</span>
      </div>
      <form
        className="grid gap-3 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
      >
        <div className="flex gap-2">
          <span className="tag self-center" style={{ "--c": "var(--color-lime)" } as React.CSSProperties}>
            GET
          </span>
          <label className="flex-1">
            <span className="sr-only">Path</span>
            <input className="field mono text-sm!" value={path} onChange={(e) => setPath(e.target.value)} spellCheck={false} />
          </label>
          <button type="submit" className="btn btn-ink btn-sm" disabled={busy} aria-label="Send request">
            <Play size={16} aria-hidden />
          </button>
        </div>
        <div className="filters">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              className="chip mono text-[11.5px]!"
              aria-pressed={p === path}
              onClick={() => {
                setPath(p);
                run(p);
              }}
            >
              {p.replace("/api/v1", "")}
            </button>
          ))}
        </div>
      </form>
      <pre className="code max-h-[420px] overflow-auto rounded-none! border-t-2 border-ink" aria-live="polite">
        {out ? `HTTP ${out.status}\n\n${out.body}` : "Pick an endpoint and press ▶"}
      </pre>
    </div>
  );
}
