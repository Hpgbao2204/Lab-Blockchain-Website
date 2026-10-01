import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface SendResult {
  /** emails Resend accepted */
  sent: number;
  /** emails written to `.data/outbox` instead (local development without Resend) */
  saved: number;
  error?: string;
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

/**
 * One email per recipient, sent with Resend's batch endpoint (100 per call, so a whole-lab notice
 * is one or two requests). Locally, without Resend, the emails are saved as HTML files under
 * `.data/outbox` so they can be opened in a browser.
 */
export async function sendMails(mails: Mail[]): Promise<SendResult> {
  if (!mails.length) return { sent: 0, saved: 0 };
  if (!mailConfigured()) {
    if (process.env.NODE_ENV === "production") return { sent: 0, saved: 0, error: "Email is not configured (RESEND_API_KEY, MAIL_FROM)." };
    const dir = path.join(process.cwd(), ".data", "outbox");
    await mkdir(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await Promise.all(
      mails.map((m, i) =>
        writeFile(path.join(dir, `${stamp}-${i + 1}-${m.to.replace(/[^a-z0-9.@-]/gi, "_")}.html`), `<!-- To: ${m.to} | Subject: ${m.subject.replace(/--/g, "-")} -->\n${m.html}`),
      ),
    );
    return { sent: 0, saved: mails.length };
  }
  let sent = 0;
  for (let i = 0; i < mails.length; i += 100) {
    const chunk = mails.slice(i, i + 100);
    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(chunk.map((m) => ({ from: process.env.MAIL_FROM, to: [m.to], subject: m.subject, text: m.text, html: m.html }))),
    });
    if (!res.ok) return { sent, saved: 0, error: `Resend ${res.status}: ${(await res.text()).slice(0, 200)}` };
    sent += chunk.length;
  }
  return { sent, saved: 0 };
}
