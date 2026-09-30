"use client";

import { useEffect, useState } from "react";
import { describeStep, getPhase } from "./protocol";

interface Line {
  seq: number;
  tag: string;
  text: string;
}

const MAX = 4;

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
    <ol className="term" role="log" aria-label="Cross-chain protocol steps (illustration)">
      {lines.map((l) => (
        <li key={l.seq}>
          <span className="k">{l.tag}</span>
          <span>{l.text}</span>
        </li>
      ))}
    </ol>
  );
}
