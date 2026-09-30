import Image from "next/image";
import Link from "next/link";

/** Only the cube from the original logo is used; its lettering has a typo, so the name is set in type. */
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Blockchainist home">
      <span className="brand-mark" style={{ background: "var(--color-card)" }}>
        <Image src="/brand/mark.png" alt="" width={26} height={25} priority />
      </span>
      <span>
        BLOCK<span className="text-blue">CHAINIST</span>
      </span>
    </Link>
  );
}
