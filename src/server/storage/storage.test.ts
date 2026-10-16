import { afterEach, describe, expect, it, vi } from "vitest";
import { s3Storage } from "./index";

afterEach(() => vi.unstubAllGlobals());

describe("s3 storage", () => {
  it("sends the raw bytes with a signature, so the upload carries a Content-Length", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const storage = s3Storage({ endpoint: "https://acct.r2.cloudflarestorage.com/", bucket: "lab", accessKeyId: "id", secretAccessKey: "secret" });
    const bytes = new Uint8Array([137, 80, 78, 71]);
    await storage.put("img-abc-png", bytes, "image/png");

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://acct.r2.cloudflarestorage.com/lab/img-abc-png");
    expect(init.method).toBe("PUT");
    // A Request or stream body would be sent chunked (R2 answers 411); a byte array is not.
    expect(init.body).toBe(bytes);
    const headers = new Headers(init.headers);
    expect(headers.get("authorization")).toMatch(/^AWS4-HMAC-SHA256 /);
    expect(headers.get("content-type")).toBe("image/png");
  });

  it("reports failed writes and treats a missing object as null", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 404 })));
    const storage = s3Storage({ endpoint: "https://s3.example", bucket: "lab", accessKeyId: "id", secretAccessKey: "secret" });
    await expect(storage.get("img-x-png")).resolves.toBeNull();
    await expect(storage.put("img-x-png", new Uint8Array([1]))).rejects.toThrow("Storage PUT failed: 404");
  });
});
