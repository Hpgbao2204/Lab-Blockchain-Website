"use client";

import { useEffect, useRef } from "react";

type TurnstileApi = {
  render: (el: HTMLElement, opts: { sitekey: string; theme: "light"; callback: (t: string) => void; "expired-callback": () => void; "error-callback": () => void }) => string;
  remove: (id: string) => void;
};
const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** Cloudflare's free "I am human" check. Renders nothing until its script has loaded. */
export function Turnstile({ siteKey, onToken }: { siteKey: string; onToken: (token: string) => void }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let id: string | undefined;
    let gone = false;
    const api = () => (window as unknown as { turnstile?: TurnstileApi }).turnstile;
    const render = () => {
      const t = api();
      if (!t || !box.current || gone) return;
      id = t.render(box.current, { sitekey: siteKey, theme: "light", callback: onToken, "expired-callback": () => onToken(""), "error-callback": () => onToken("") });
    };
    let script = document.querySelector<HTMLScriptElement>("script[data-turnstile]");
    if (!script) {
      script = document.createElement("script");
      script.src = SRC;
      script.async = true;
      script.dataset.turnstile = "1";
      document.head.appendChild(script);
    }
    if (api()) render();
    else script.addEventListener("load", render, { once: true });
    return () => {
      gone = true;
      if (id) api()?.remove(id);
    };
  }, [siteKey, onToken]);

  return <div ref={box} className="min-h-[65px]" aria-label="Human verification" />;
}
