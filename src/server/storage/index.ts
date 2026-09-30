import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { AwsClient } from "aws4fetch";

/**
 * Where uploaded bytes live: local disk (`UPLOAD_DIR`, default `.data/uploads`) for development,
 * or any S3-compatible bucket (Cloudflare R2, Supabase Storage, AWS S3) when `S3_BUCKET` is set.
 * The S3 driver also hands out short-lived signed URLs, so browsers upload and download directly
 * and large files never pass through a serverless function (Vercel caps bodies at 4.5 MB).
 */
export interface Storage {
  put(key: string, bytes: Uint8Array, contentType?: string): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
  remove(key: string): Promise<void>;
  /** Size and first bytes of a stored object, to check a direct upload before accepting it. */
  inspect(key: string, headBytes: number): Promise<{ size: number; head: Uint8Array } | null>;
  /** Only drivers that support direct browser transfers implement these. */
  signedPut?(key: string, contentType: string): Promise<string>;
  signedGet?(key: string, opts: { filename: string; contentType: string; download: boolean }): Promise<string>;
}

export const validKey = (key: string) => /^[a-z0-9-]+$/i.test(key);

export function diskStorage(dir: string): Storage {
  const file = (key: string) => {
    if (!validKey(key)) throw new Error("Bad storage key");
    return path.join(dir, key);
  };
  const get = async (key: string) => {
    try {
      return new Uint8Array(await readFile(file(key)));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw e;
    }
  };
  return {
    async put(key, bytes) {
      await mkdir(dir, { recursive: true });
      await writeFile(file(key), bytes);
    },
    get,
    async remove(key) {
      await rm(file(key), { force: true });
    },
    async inspect(key, headBytes) {
      const bytes = await get(key);
      return bytes && { size: bytes.byteLength, head: bytes.subarray(0, headBytes) };
    },
  };
}

export interface S3Config {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  region?: string;
}

/** S3-compatible object storage (path-style URLs), signed with SigV4 by `aws4fetch`. */
export function s3Storage(cfg: S3Config, signedTtlSeconds = 300): Storage {
  const aws = new AwsClient({ accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey, service: "s3", region: cfg.region || "auto" });
  const objectUrl = (key: string) => {
    if (!validKey(key)) throw new Error("Bad storage key");
    return new URL(`${cfg.endpoint.replace(/\/+$/, "")}/${cfg.bucket}/${key}`);
  };
  const call = async (key: string, init: RequestInit, okMissing = false) => {
    const res = await aws.fetch(objectUrl(key).toString(), init);
    if (okMissing && res.status === 404) return null;
    if (!res.ok) throw new Error(`Storage ${init.method ?? "GET"} failed: ${res.status}`);
    return res;
  };
  const presign = async (method: string, url: URL, headers?: Record<string, string>) => {
    url.searchParams.set("X-Amz-Expires", String(signedTtlSeconds));
    const signed = await aws.sign(url.toString(), { method, headers, aws: { signQuery: true } });
    return signed.url;
  };
  return {
    async put(key, bytes, contentType = "application/octet-stream") {
      await call(key, { method: "PUT", body: bytes as BodyInit, headers: { "Content-Type": contentType } });
    },
    async get(key) {
      const res = await call(key, { method: "GET" }, true);
      return res && new Uint8Array(await res.arrayBuffer());
    },
    async remove(key) {
      await call(key, { method: "DELETE" }, true);
    },
    async inspect(key, headBytes) {
      const res = await call(key, { method: "GET", headers: { Range: `bytes=0-${headBytes - 1}` } }, true);
      if (!res) return null;
      // 206 carries the full size in Content-Range ("bytes 0-15/12345"); a 200 means the object is tiny.
      const total = res.headers.get("content-range")?.split("/")[1];
      const head = new Uint8Array(await res.arrayBuffer());
      return { size: total ? Number(total) : head.byteLength, head: head.subarray(0, headBytes) };
    },
    signedPut(key, contentType) {
      return presign("PUT", objectUrl(key), { "Content-Type": contentType });
    },
    signedGet(key, { filename, contentType, download }) {
      const url = objectUrl(key);
      url.searchParams.set("response-content-type", contentType);
      url.searchParams.set("response-content-disposition", `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(filename)}`);
      return presign("GET", url);
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
    async inspect(k, n) {
      const b = m.get(k);
      return b ? { size: b.byteLength, head: b.subarray(0, n) } : null;
    },
  };
}

const g = globalThis as unknown as { __labStorage?: Storage };
export function getStorage(): Storage {
  if (g.__labStorage) return g.__labStorage;
  const e = process.env;
  g.__labStorage =
    e.S3_BUCKET && e.S3_ENDPOINT && e.S3_ACCESS_KEY_ID && e.S3_SECRET_ACCESS_KEY
      ? s3Storage({ endpoint: e.S3_ENDPOINT, bucket: e.S3_BUCKET, accessKeyId: e.S3_ACCESS_KEY_ID, secretAccessKey: e.S3_SECRET_ACCESS_KEY, region: e.S3_REGION })
      : diskStorage(e.UPLOAD_DIR || path.join(process.cwd(), ".data", "uploads"));
  return g.__labStorage;
}
