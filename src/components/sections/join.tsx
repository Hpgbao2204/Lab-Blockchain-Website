import Link from "next/link";
import { Reveal } from "@/components/site/reveal";

export function Join() {
  return (
    <section id="join" className="mx-auto max-w-[1180px] px-5 pb-28 sm:px-8">
      <Reveal>
        <div className="relative overflow-hidden rounded-[32px] bg-ink px-7 py-16 text-white sm:px-14 sm:py-20">
          <div aria-hidden className="absolute -right-16 -top-16 h-72 w-72 rotate-12 rounded-[40px] border border-white/15 bg-gradient-to-br from-chain-a/60 to-relay/60 blur-[1px]" />
          <div aria-hidden className="absolute -bottom-20 right-28 h-52 w-52 -rotate-12 rounded-[32px] border border-white/15 bg-gradient-to-br from-chain-b/70 to-chain-b/10" />
          <p className="eyebrow !text-white/60">04 — Gia nhập</p>
          <h2 className="display mt-4 max-w-xl text-[clamp(2.2rem,5vw,4rem)]">
            Cùng xây <span className="serif-accent text-[#9fc0ff]">khối tiếp theo</span> của chuỗi.
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/75">
            Nhóm luôn tìm sinh viên và nghiên cứu sinh yêu thích mật mã, hệ thống phân tán và an toàn thông tin.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/join" className="rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-[#dfe9ff]">
              Ứng tuyển
            </Link>
            <Link href="/login" className="rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold transition hover:border-white hover:bg-white/10">
              Thành viên đăng nhập
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
