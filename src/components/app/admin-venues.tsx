"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp } from "lucide-react";
import { api } from "@/lib/api/client";
import { parseCsv, venueFileKind } from "@/lib/venues/csv";

const CHUNK = 1000;

interface Parsed {
  name: string;
  kind: "conference" | "journal";
  columns: string[];
  rows: string[][];
}

type Sum = { inserted: number; updated: number; skipped: number; removed: number };

/**
 * Reads the CSV in the browser and sends it in chunks of 1000 rows (one 13 MB file would not fit
 * in a single request on Vercel), then ends the import so venues missing from the file go away.
 */
export function VenueImport() {
  const router = useRouter();
  const [file, setFile] = useState<Parsed | null>(null);
  const [prune, setPrune] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<(Sum & { kind: string }) | null>(null);

  async function pick(f: File | undefined) {
    setError("");
    setResult(null);
    setFile(null);
    if (!f) return;
    const { columns, rows } = parseCsv(await f.text());
    const kind = venueFileKind(columns);
    if (!kind) return setError("This file has neither a conference_id nor a journal_id column. Pick conferences.csv or journals.csv.");
    if (!rows.length) return setError("The file has a header but no rows.");
    setFile({ name: f.name, kind, columns, rows });
  }

  async function run() {
    if (!file) return;
    setBusy(true);
    setError("");
    setDone(0);
    const runId = crypto.randomUUID();
    const sum: Sum = { inserted: 0, updated: 0, skipped: 0, removed: 0 };
    try {
      for (let i = 0; i < file.rows.length; i += CHUNK) {
        const r = await api<Omit<Sum, "removed">>("/admin/venues", { body: { kind: file.kind, run: runId, columns: file.columns, rows: file.rows.slice(i, i + CHUNK) } });
        sum.inserted += r.inserted;
        sum.updated += r.updated;
        sum.skipped += r.skipped;
        setDone(Math.min(i + CHUNK, file.rows.length));
      }
      const end = await api<{ removed: number }>("/admin/venues/finish", { body: { kind: file.kind, run: runId, prune } });
      sum.removed = end.removed;
      setResult({ ...sum, kind: file.kind });
      setFile(null);
      router.refresh();
    } catch (e) {
      setError(`${(e as Error).message} Nothing was removed; you can run the import again.`);
    } finally {
      setBusy(false);
    }
  }

  const pct = file ? Math.round((done / file.rows.length) * 100) : 0;

  return (
    <div className="card grid gap-4 p-5">
      <label className="label">
        CSV file
        <input type="file" accept=".csv,text/csv" className="field" disabled={busy} onChange={(e) => pick(e.target.files?.[0])} />
        <span className="hint">conferences.csv or journals.csv, in the same columns as the files from Impaq. The kind is read from the header.</span>
      </label>

      {file && (
        <div className="grid gap-3">
          <p className="success m-0">
            <b>{file.name}</b>: {file.rows.length.toLocaleString("en-US")} {file.kind}s, {file.columns.length} columns. First rows:{" "}
            {file.rows
              .slice(0, 3)
              .map((r) => r[file.columns.indexOf(file.kind === "conference" ? "acronym" : "name")])
              .join(", ")}
            .
          </p>
          <label className="venue-check">
            <input type="checkbox" checked={prune} disabled={busy} onChange={(e) => setPrune(e.target.checked)} />
            Remove {file.kind}s that are not in this file (use when the file is the full, newer list)
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn btn-yellow" disabled={busy} onClick={run}>
              <FileUp size={16} aria-hidden /> {busy ? "Importing…" : `Import ${file.rows.length.toLocaleString("en-US")} ${file.kind}s`}
            </button>
            {busy && (
              <span className="mono text-sm" aria-live="polite">
                {done.toLocaleString("en-US")} / {file.rows.length.toLocaleString("en-US")} ({pct}%)
              </span>
            )}
          </div>
          {busy && (
            <div className="h-3 overflow-hidden rounded-full border-2 border-ink bg-paper" aria-hidden>
              <div className="h-full bg-yellow transition-all" style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
      )}

      {error && <p className="error m-0">{error}</p>}
      {result && (
        <p className="success m-0" role="status">
          Done: {result.inserted.toLocaleString("en-US")} new, {result.updated.toLocaleString("en-US")} updated, {result.removed.toLocaleString("en-US")} removed
          {result.skipped ? `, ${result.skipped} rows skipped (no id or name, or repeated)` : ""}.
        </p>
      )}
    </div>
  );
}
