import Link from "next/link";
import { Brand } from "./brand";

export function Footer() {
  return (
    <footer className="border-t border-line bg-white/50">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-8 px-5 py-12 sm:px-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Brand />
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Nhóm nghiên cứu Blockchain, Mạng &amp; Bảo mật. Nghiên cứu liên chuỗi, riêng tư và định danh phi tập trung.
          </p>
        </div>
        <div className="mono text-muted">
          <p>© {new Date().getFullYear()} Blockchainist Research Team</p>
          <p className="mt-2">
            Chân dung nền: Wikimedia Commons (CC) —{" "}
            <Link href="/#pioneers" className="underline decoration-line underline-offset-4 hover:text-ink">
              xem ghi công
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
