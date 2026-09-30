"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { pioneers } from "@/data/pioneers";

const HeroScene = dynamic(() => import("./scene/hero-scene"), { ssr: false });

function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function detectWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
const noopSubscribe = () => () => {};

/** Mounts the 3D scene client-side only; degrades to a static portrait mosaic without WebGL. */
export function HeroCanvas({ onSpotlight }: { onSpotlight: (id: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const reduced = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);
  const webgl = useSyncExternalStore(noopSubscribe, detectWebGL, () => true);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    const vis = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", vis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  return (
    <div ref={box} className="absolute inset-0">
      {webgl ? (
        <div className={`absolute inset-0 transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}>
          <HeroScene frozen={reduced} active={inView && tabVisible} onSpotlight={onSpotlight} onReady={() => setReady(true)} />
        </div>
      ) : (
        <div className="absolute inset-0 grid grid-cols-4 gap-3 p-6 opacity-30 sm:grid-cols-6" aria-hidden>
          {pioneers
            .filter((p) => p.image)
            .slice(0, 6)
            .map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p.id} src={p.image} alt="" className="h-full w-full object-cover grayscale" />
            ))}
        </div>
      )}
    </div>
  );
}
