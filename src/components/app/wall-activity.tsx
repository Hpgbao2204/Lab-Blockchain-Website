"use client";

import { useEffect, useSyncExternalStore } from "react";

export interface WallActivity {
  total: number;
  lab: number;
  groups: Record<string, number>;
}

/*
 * One shared copy of "what is new on my walls" for every dot on the page, refreshed every minute
 * while the tab is visible and right after a wall is opened.
 */
let current: WallActivity | null = null;
const listeners = new Set<() => void>();
let sent = 0;
let applied = 0;
let users = 0;
let timer: ReturnType<typeof setInterval> | undefined;

async function request(init?: RequestInit) {
  const n = ++sent;
  try {
    const res = await fetch("/api/v1/me/activity", { credentials: "same-origin", cache: "no-store", ...init });
    const json = res.ok ? await res.json() : null;
    // an older answer that arrives late must not bring back a dot that was just cleared
    if (n < applied) return;
    applied = n;
    current = json?.data ?? null;
    listeners.forEach((f) => f());
  } catch {
    // offline or signed out: keep what we had
  }
}

export const refreshWallActivity = () => request();

const onVisible = () => document.visibilityState === "visible" && request();

function subscribe(f: () => void) {
  listeners.add(f);
  return () => listeners.delete(f);
}

/** The counts for the signed-in person; `null` while unknown or when `enabled` is false. */
export function useWallActivity(enabled = true) {
  const a = useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
  useEffect(() => {
    if (!enabled) return;
    if (++users === 1) {
      timer = setInterval(() => document.visibilityState === "visible" && request(), 60_000);
      document.addEventListener("visibilitychange", onVisible);
    }
    request();
    return () => {
      if (--users === 0) {
        clearInterval(timer);
        document.removeEventListener("visibilitychange", onVisible);
      }
    };
  }, [enabled]);
  return enabled ? a : null;
}

/** Put on a wall page: marks it read, which clears its share of the dot. */
export function MarkWallSeen({ scope }: { scope: string }) {
  useEffect(() => {
    request({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scope }) });
  }, [scope]);
  return null;
}

/** The small red badge, like a notification count; nothing when there is nothing new. */
export function UnreadDot({ n, className = "" }: { n: number | undefined; className?: string }) {
  if (!n) return null;
  return (
    <span className={`unread-dot ${className}`}>
      <span aria-hidden>{n > 9 ? "9+" : n}</span>
      <span className="sr-only"> ({n} new)</span>
    </span>
  );
}
