/**
 * Cloudflare Turnstile, the free captcha on the Join form. It is on once both keys are set:
 * `TURNSTILE_SITE_KEY` (public, handed to the form by the server; `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
 * works too) and `TURNSTILE_SECRET_KEY`. With only one of them it stays off, so the form never
 * asks for a check it cannot show; then it relies on the honeypot and the rate limit only.
 */
export function captchaSiteKey() {
  const site = process.env.TURNSTILE_SITE_KEY?.trim() || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  return site && process.env.TURNSTILE_SECRET_KEY?.trim() ? site : undefined;
}

export const captchaEnabled = () => Boolean(captchaSiteKey());

export async function verifyCaptcha(token: string | undefined, ip: string | null, fetcher: typeof fetch = fetch): Promise<{ ok: true } | { ok: false; reason: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret || !captchaEnabled()) return { ok: true };
  if (!token) return { ok: false, reason: "Please complete the “I am human” check." };
  try {
    const res = await fetcher("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, ...(ip ? { remoteip: ip } : {}) }),
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success ? { ok: true } : { ok: false, reason: "The “I am human” check failed or expired. Please try it again." };
  } catch {
    return { ok: false, reason: "Could not reach the “I am human” check. Please try again in a minute." };
  }
}
