import Image from "next/image";
import Link from "next/link";

export function Brand({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`} aria-label="Blockchainist — trang chủ">
      <Image src="/brand/mark.png" alt="" width={34} height={33} priority />
      <span className="display text-[1.15rem] tracking-tight">
        Block<span className="text-chain-a">chainist</span>
      </span>
    </Link>
  );
}
