import Link from "next/link";
import { Brand } from "./brand";

const links = [
  { href: "/#research", label: "Nghiên cứu" },
  { href: "/#pioneers", label: "Tiền nhân" },
  { href: "/#publications", label: "Công bố" },
  { href: "/#join", label: "Gia nhập" },
];

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6">
      <div className="glass mx-auto flex max-w-[1180px] items-center justify-between gap-4 rounded-full py-2 pl-5 pr-2">
        <Brand />
        <nav aria-label="Chính" className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="rounded-full px-4 py-2 text-sm font-medium text-ink-2 transition hover:bg-white hover:text-ink">
              {l.label}
            </a>
          ))}
        </nav>
        <Link href="/login" className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-chain-a">
          Đăng nhập
        </Link>
      </div>
    </header>
  );
}
