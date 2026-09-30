import Image from "next/image";
import Link from "next/link";

/** New mark (public/brand/logo-mark.svg) + name set in type. */
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Blockchainist home">
      <Image src="/brand/logo-mark.svg" alt="" width={38} height={38} priority unoptimized />
      <span>
        BLOCK<span className="text-blue">CHAINIST</span>
      </span>
    </Link>
  );
}
