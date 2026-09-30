import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Where uploaded bytes live. Only a local-disk driver for now (`UPLOAD_DIR`, default
 * `.data/uploads`); an S3-compatible driver can implement the same interface when the site is
 * deployed to a host without a persistent disk.
 */
export interface Storage {
  put(key: string, bytes: Uint8Array): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
  remove(key: string): Promise<void>;
}

export function diskStorage(dir: string): Storage {
  const file = (key: string) => {
    if (!/^[a-z0-9-]+$/i.test(key)) throw new Error("Bad storage key");
    return path.join(dir, key);
  };
  return {
    async put(key, bytes) {
      await mkdir(dir, { recursive: true });
      await writeFile(file(key), bytes);
    },
    async get(key) {
      try {
        return new Uint8Array(await readFile(file(key)));
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw e;
      }
    },
    async remove(key) {
      await rm(file(key), { force: true });
    },
  };
}

/** In-memory storage for tests. */
export function memoryStorage(): Storage {
  const m = new Map<string, Uint8Array>();
  return {
    async put(k, b) {
      m.set(k, b);
    },
    async get(k) {
      return m.get(k) ?? null;
    },
    async remove(k) {
      m.delete(k);
    },
  };
}

const g = globalThis as unknown as { __labStorage?: Storage };
export function getStorage(): Storage {
  return (g.__labStorage ??= diskStorage(process.env.UPLOAD_DIR || path.join(process.cwd(), ".data", "uploads")));
}
