/**
 * Cloudflare Turnstile, the free captcha on the Join form. It is on once `TURNSTILE_SECRET_KEY`
 * (server) and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (browser) are set; without them the form relies
 * on the honeypot and the per-address rate limit only.
 */
export const captchaEnabled = () => Boolean(process.env.TURNSTILE_SECRET_KEY?.trim());

export async function verifyCaptcha(token: string | undefined, ip: string | null, fetcher: typeof fetch = fetch): Promise<{ ok: true } | { ok: false; reason: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return { ok: true };
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
