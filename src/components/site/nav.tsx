"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Brand } from "./brand";
import { siteLinks } from "./links";

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    fetch("/api/v1/me", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((j) => setSignedIn(!!j?.data))
      .catch(() => setSignedIn(false));
  }, [pathname]);
  const account = signedIn ? { href: "/app", label: "My wall" } : { href: "/login", label: "Sign in" };
  const current = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <Brand />
        <nav aria-label="Main" className="nav-links max-lg:hidden">
          {siteLinks.map((l) => (
            <Link key={l.href} href={l.href} className="nav-link" aria-current={current(l.href) ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href={account.href} className="btn btn-ink btn-sm max-sm:hidden" style={{ boxShadow: "3px 3px 0 var(--color-yellow)" }}>
            {account.label}
          </Link>
          <button
            type="button"
            className="btn btn-sm lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Main" className="wrap grid gap-2 pb-4 lg:hidden">
          {[...siteLinks, account].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="nav-link border-ink! bg-card text-base!"
              aria-current={current(l.href) ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
