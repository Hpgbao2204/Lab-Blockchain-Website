import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-sm uppercase tracking-[0.22em] text-primary">404</p>
      <h1 className="mt-4 text-4xl font-semibold text-foreground">Không tìm thấy trang</h1>
      <p className="mt-4 text-muted">Đường dẫn này chưa có trong bản base migration.</p>
      <Button href="/" className="mt-8">Về trang chủ</Button>
    </section>
  );
}
