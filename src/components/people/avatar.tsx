"use client";
/* eslint-disable @next/next/no-img-element -- member photos come from any https host (GitHub, personal sites) */

import { useState } from "react";

/** Member photo; falls back to initials when there is none or the link is broken. */
export function Avatar({ person, size = 160 }: { person: { name: string; photo: string | null }; size?: number }) {
  const [broken, setBroken] = useState(false);
  const initials = person.name
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join("");
  return person.photo && !broken ? (
    <img
      src={person.photo}
      alt={person.name}
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
      className="aspect-square rounded-2xl border-2 border-ink object-cover object-top"
      style={{ width: size, height: size, boxShadow: "var(--shadow)" }}
    />
  ) : (
    <span className="member-mark" style={{ width: size, height: size, fontSize: size / 3, borderRadius: 18 }} aria-hidden>
      {initials}
    </span>
  );
}
