import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap page grid place-items-center text-center">
      <p className="mono text-sm text-muted">404 · block not found</p>
      <h1 className="display mt-3 text-[clamp(36px,6vw,72px)]">Orphaned block</h1>
      <p className="mt-3 max-w-md text-ink-2">This page is not on the canonical chain.</p>
      <Link href="/" className="btn btn-ink mt-8">
        Back to genesis
      </Link>
    </div>
  );
}
