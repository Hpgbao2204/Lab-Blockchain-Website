import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstile } from "./turnstile";

describe("verifyTurnstile", () => {
  afterEach(() => {
    delete process.env.TURNSTILE_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it("rejects a failed Turnstile response", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    process.env.NEXT_PUBLIC_SITE_URL = "https://blockchainist.id.vn";

    await expect(
      verifyTurnstile("token", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false }))))
    ).resolves.toEqual({ valid: false, reason: "Turnstile verification failed" });
  });

  it("accepts a token verified for the configured hostname", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    process.env.NEXT_PUBLIC_SITE_URL = "https://blockchainist.id.vn";

    await expect(
      verifyTurnstile(
        "token",
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ success: true, hostname: "blockchainist.id.vn" }))
        )
      )
    ).resolves.toEqual({ valid: true });
  });

  it("rejects a token verified for an unexpected hostname", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    process.env.NEXT_PUBLIC_SITE_URL = "https://blockchainist.id.vn";

    await expect(
      verifyTurnstile(
        "token",
        vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, hostname: "example.com" })))
      )
    ).resolves.toEqual({ valid: false, reason: "Turnstile hostname is not allowed" });
  });
});
