import "server-only";

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export function mailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

/**
 * Sends through Resend's HTTP API when `RESEND_API_KEY` and `MAIL_FROM` are set.
 * Without them nothing leaves the server and the caller gets `sent: false`.
 */
export async function sendMail(mail: Mail): Promise<{ sent: boolean; error?: string }> {
  if (!mailConfigured()) return { sent: false, error: "Email is not configured (RESEND_API_KEY, MAIL_FROM)." };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.MAIL_FROM, to: [mail.to], subject: mail.subject, text: mail.text, html: mail.html }),
  });
  if (!res.ok) return { sent: false, error: `Resend ${res.status}: ${(await res.text()).slice(0, 200)}` };
  return { sent: true };
}
