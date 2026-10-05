import { afterEach, describe, expect, it } from "vitest";
import { captchaEnabled, verifyCaptcha } from "./captcha";

const answer = (body: unknown) => (async () => new Response(JSON.stringify(body))) as unknown as typeof fetch;

describe("captcha", () => {
  afterEach(() => {
    delete process.env.TURNSTILE_SECRET_KEY;
  });

  it("is off without a secret key, so local development needs nothing", async () => {
    expect(captchaEnabled()).toBe(false);
    expect(await verifyCaptcha(undefined, null)).toEqual({ ok: true });
  });

  it("with a key, a missing, failed or unreachable check is refused", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    expect(captchaEnabled()).toBe(true);
    expect((await verifyCaptcha(undefined, null)).ok).toBe(false);
    expect((await verifyCaptcha("t", "1.2.3.4", answer({ success: false }))).ok).toBe(false);
    expect((await verifyCaptcha("t", null, (async () => Promise.reject(new Error("down"))) as typeof fetch)).ok).toBe(false);
    expect(await verifyCaptcha("t", "1.2.3.4", answer({ success: true }))).toEqual({ ok: true });
  });
});
