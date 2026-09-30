"use client";

import { useState, useSyncExternalStore } from "react";
import { ArrowDown } from "lucide-react";
import { pioneers } from "@/data/pioneers";
import { HeroCanvas } from "./hero-canvas";
import { EventLog } from "./event-log";

const subscribe = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

export function Hero() {
  const [spotlightId, setSpotlightId] = useState("merkle");
  const reduced = useSyncExternalStore(subscribe, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => false);
  const spotlight = pioneers.find((p) => p.id === spotlightId);

  return (
    <section className="relative isolate flex min-h-[max(100svh,980px)] flex-col overflow-hidden bg-bg md:min-h-[100svh]" aria-labelledby="hero-title">
      <HeroCanvas onSpotlight={setSpotlightId} />

      {/* readability scrims: left for the headline, bottom blends into the next section */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,var(--color-bg)_0%,rgb(238_242_249/0.9)_38%,rgb(238_242_249/0)_58%)] lg:bg-[linear-gradient(90deg,var(--color-bg)_0%,rgb(238_242_249/0.88)_30%,rgb(238_242_249/0)_62%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-bg to-transparent" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1320px] flex-1 flex-col px-5 pb-8 pt-24 sm:px-8 sm:pt-28 lg:px-12">
        <div className="max-w-[760px]">
          <p className="eyebrow reveal is-in mb-5 flex items-center gap-3">
            <span className="inline-block h-px w-8 bg-ink/40" />
            Nhóm nghiên cứu Blockchain · Mạng · Bảo mật
          </p>
          <h1 id="hero-title" className="display text-[clamp(3rem,7.4vw,6.6rem)] text-ink">
            Niềm tin,
            <br />
            xuyên mọi{" "}
            <span className="serif-accent bg-gradient-to-r from-chain-a via-relay to-chain-b bg-clip-text pr-2 text-transparent">chuỗi.</span>
          </h1>
          <p className="mt-6 max-w-[520px] text-[clamp(1rem,1.5vw,1.2rem)] leading-relaxed text-ink-2">
            Blockchainist nghiên cứu liên chuỗi, chứng minh không tiết lộ tri thức và định danh phi tập trung — từ chứng minh hình thức đến hệ thống kiểm chứng được.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#research" className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_30px_-12px_rgb(11_20_55/0.7)] transition hover:-translate-y-0.5 hover:bg-chain-a">
              Khám phá nghiên cứu
              <ArrowDown className="h-4 w-4 transition group-hover:translate-y-0.5" aria-hidden />
            </a>
            <a href="#join" className="inline-flex items-center rounded-full border border-ink/20 bg-white/60 px-6 py-3.5 text-sm font-semibold text-ink backdrop-blur transition hover:border-ink hover:bg-white">
              Gia nhập nhóm
            </a>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-6 pt-12 lg:flex-row lg:items-end lg:gap-12">
          <div className="hidden lg:block"><EventLog frozen={reduced} /></div>
          <div className="hidden max-w-[340px] lg:block" aria-live="off">
            <p className="eyebrow mb-2">Đứng trên vai người khổng lồ</p>
            {spotlight && (
              <div key={spotlight.id} className="animate-[fadein_.8s_ease]">
                <p className="display text-2xl text-ink">
                  {spotlight.name} <span className="mono text-muted">{spotlight.year}</span>
                </p>
                <p className="mt-1 text-sm leading-snug text-ink-2">{spotlight.contribution}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
