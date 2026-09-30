"use client";

import { useState, useSyncExternalStore } from "react";
import { pioneers } from "@/data/pioneers";
import { HeroCanvas } from "./hero-canvas";
import { EventLog } from "./event-log";

const subscribe = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/** Hero layout: copy on the left, the 3D cross-chain "window" on the right, and a pioneer band underneath. */
export function HeroShell({ children }: { children: React.ReactNode }) {
  const [spotlightId, setSpotlightId] = useState("merkle");
  const reduced = useSyncExternalStore(subscribe, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => false);
  const spotlight = pioneers.find((p) => p.id === spotlightId) ?? pioneers[0];

  return (
    <section className="wrap" aria-labelledby="hero-title">
      <div className="hero">
        <div className="hero-copy">{children}</div>
        <div className="hero-visual">
          <div className="window">
            <div className="window-bar" aria-hidden>
              <i style={{ "--c": "var(--color-red)" } as React.CSSProperties} />
              <i style={{ "--c": "var(--color-yellow)" } as React.CSSProperties} />
              <i style={{ "--c": "var(--color-lime)" } as React.CSSProperties} />
              <span className="title">cross-chain.live</span>
              <span className="tag" style={{ "--c": "var(--color-yellow)" } as React.CSSProperties}>
                HTLC
              </span>
            </div>
            <div className="stage">
              <HeroCanvas onSpotlight={setSpotlightId} />
              <p className="stage-hint" aria-hidden>
                Alice ⇄ Relay ⇄ Bob
              </p>
            </div>
            <EventLog frozen={reduced} />
          </div>
        </div>
      </div>

      <div className="quotes" aria-label="Pioneer in the spotlight">
        <span className="quote-mark" aria-hidden>
          “
        </span>
        <div className="quote-stage" aria-live="off">
          <figure key={spotlight.id} className="quote">
            <blockquote>{spotlight.contribution}</blockquote>
            <figcaption>
              {spotlight.name}, {spotlight.year}
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
