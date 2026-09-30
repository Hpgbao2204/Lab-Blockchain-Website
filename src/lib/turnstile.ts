type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export type TurnstileResult =
  | { valid: true }
  | { valid: false; reason: string; unavailable?: boolean };

type TurnstileResponse = {
  success?: boolean;
  hostname?: string;
};

function expectedHostnames(): Set<string> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const hostname = siteUrl ? new URL(siteUrl).hostname : undefined;
  const hostnames = new Set(hostname ? [hostname] : []);

  if (process.env.NODE_ENV !== "production") {
    hostnames.add("localhost");
  }

  return hostnames;
}

export async function verifyTurnstile(
  token: string,
  fetcher: FetchLike = fetch
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    return { valid: false, reason: "Turnstile is not configured", unavailable: true };
  }

  let response: Response;
  try {
    response = await fetcher("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token })
    });
  } catch {
    return { valid: false, reason: "Turnstile verification is unavailable", unavailable: true };
  }

  if (!response.ok) {
    return { valid: false, reason: "Turnstile verification is unavailable", unavailable: true };
  }

  const payload = (await response.json()) as TurnstileResponse;
  if (!payload.success) {
    return { valid: false, reason: "Turnstile verification failed" };
  }

  const allowedHostnames = expectedHostnames();
  if (!payload.hostname || !allowedHostnames.has(payload.hostname)) {
    return { valid: false, reason: "Turnstile hostname is not allowed" };
  }

  return { valid: true };
}
