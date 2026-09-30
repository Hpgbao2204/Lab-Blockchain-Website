"use client";

import { useEffect, useRef } from "react";

/** Typewriter over a list of phrases (portfolio hero effect). Static for reduced motion. */
export function Rotator({ words }: { words: string[] }) {
  const el = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = el.current;
    if (!node || words.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0;
    let timer = 0;
    const type = (word: string, n = 0) => {
      node.textContent = word.slice(0, n);
      timer = window.setTimeout(n < word.length ? () => type(word, n + 1) : erase, n < word.length ? 45 : 2400);
    };
    const erase = () => {
      const t = node.textContent ?? "";
      if (t.length) {
        node.textContent = t.slice(0, -1);
        timer = window.setTimeout(erase, 22);
      } else {
        i = (i + 1) % words.length;
        type(words[i]);
      }
    };
    timer = window.setTimeout(erase, 2600);
    return () => window.clearTimeout(timer);
  }, [words]);

  return (
    <>
      <span ref={el} className="rotator">
        {words[0]}
      </span>
      <span className="caret" aria-hidden />
    </>
  );
}
