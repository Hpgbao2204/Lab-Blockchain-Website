"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/app", label: "My wall" },
  { href: "/admin", label: "Accounts & groups", admin: true },
  { href: "/admin/meetings", label: "Meetings", admin: true },
  { href: "/admin/reports", label: "Monthly report", admin: true },
  { href: "/admin/reminders", label: "Monday email", admin: true },
  { href: "/account/profile", label: "My profile" },
  { href: "/account/password", label: "Password" },
];

export function AppNav({ admin }: { admin: boolean }) {
  const path = usePathname();
  const current = ITEMS.filter((i) => path === i.href || path.startsWith(`${i.href}/`)).sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <>
      {ITEMS.filter((i) => admin || !i.admin).map((i) => (
        <Link key={i.href} href={i.href} className="nav-link whitespace-nowrap" aria-current={current === i.href ? "page" : undefined}>
          {i.label}
        </Link>
      ))}
    </>
  );
}
