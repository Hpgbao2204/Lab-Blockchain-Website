"use client";

import { useEffect, useState } from "react";
import { describeStep, getPhase } from "./protocol";

interface Line {
  seq: number;
  tag: string;
  text: string;
}

const MAX = 5;

/** Terminal-style narration of the cross-chain exchange, driven by the same clock as the 3D scene. */
export function EventLog({ frozen }: { frozen?: boolean }) {
  const [lines, setLines] = useState<Line[]>([]);

  useEffect(() => {
    const tick = () => {
      const phase = getPhase(frozen ? 4200 : Date.now());
      const { tag, text } = describeStep(phase.kind, phase.sender, phase.receiver);
      setLines((prev) => {
        if (prev.length && prev[prev.length - 1].seq === phase.seq) return prev;
        return [...prev, { seq: phase.seq, tag, text }].slice(-MAX);
      });
    };
    tick();
    if (frozen) return;
    const id = window.setInterval(tick, 150);
    return () => window.clearInterval(id);
  }, [frozen]);

  return (
    <div className="glass w-full max-w-[420px] rounded-2xl p-4 font-mono text-[12px] leading-relaxed" role="log" aria-label="Diễn biến giao thức liên chuỗi (minh hoạ)">
      <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-muted">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-proof [animation:blink_1.4s_infinite]" />
          cross-chain · live
        </span>
        <span>HTLC</span>
      </div>
      <ol className="space-y-1">
        {lines.map((l, i) => (
          <li key={l.seq} className={`flex gap-2 transition-opacity ${i === lines.length - 1 ? "opacity-100" : "opacity-50"}`}>
            <span className="w-12 shrink-0 text-chain-a">{l.tag}</span>
            <span className="text-ink">{l.text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
