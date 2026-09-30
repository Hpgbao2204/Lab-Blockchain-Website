import Link from "next/link";

export function ComingSoon({ title, note }: { title: string; note: string }) {
  return (
    <main className="grid min-h-[100svh] place-items-center px-6 pt-24">
      <div className="max-w-md text-center">
        <p className="eyebrow mb-4">Đang xây dựng</p>
        <h1 className="display text-5xl">{title}</h1>
        <p className="mt-5 leading-relaxed text-ink-2">{note}</p>
        <Link href="/" className="mt-8 inline-flex rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-chain-a">
          ← Về trang chủ
        </Link>
      </div>
    </main>
  );
}
