import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number, opts: { N: number; r: number; p: number }) => Promise<Buffer>;
const PARAMS = { N: 16384, r: 8, p: 1 };
const KEYLEN = 64;

/** `scrypt$N$r$p$salt$hash` (base64). Node's built-in scrypt, no native dependency. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, KEYLEN, PARAMS);
  return ["scrypt", PARAMS.N, PARAMS.r, PARAMS.p, salt.toString("base64"), hash.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, n, r, p, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const actual = await scrypt(password, Buffer.from(salt, "base64"), expected.length, { N: +n, r: +r, p: +p });
  return timingSafeEqual(actual, expected);
}

/** Readable temporary password for new accounts, e.g. `lunar-7Kq4-orbit`. */
export function temporaryPassword(): string {
  const words = ["block", "chain", "proof", "relay", "merkle", "nonce", "ledger", "oracle", "shard", "token", "lunar", "orbit", "cipher", "vector"];
  const pick = () => words[randomBytes(1)[0] % words.length];
  const mid = randomBytes(3).toString("base64url").slice(0, 4);
  return `${pick()}-${mid}-${pick()}`;
}

export const PASSWORD_MIN = 10;
