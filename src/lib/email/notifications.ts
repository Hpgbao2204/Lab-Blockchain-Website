export type EmailSendResult =
  | { ok: true; id: string }
  | { ok: false; error: Error };

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return { apiKey };
}

async function sendConfiguredEmail({
  to,
  subject,
  text,
  replyTo
}: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: new Error("Resend API key is not configured") };
  }

  const from = process.env.RESEND_FROM_EMAIL || process.env.FROM_EMAIL;
  if (!from) {
    return { ok: false, error: new Error("Resend sender email is not configured") };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    const data = await response.json();

    if (!response.ok || !data?.id) {
      const msg =
        data?.message ||
        data?.error?.message ||
        `HTTP ${response.status}: Failed to send email via Resend`;
      return { ok: false, error: new Error(msg) };
    }

    return { ok: true, id: data.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error : new Error("Unknown email error") };
  }
}

export async function sendApplicationNotification(params: {
  applicationId: string;
  applicantName: string;
  applicantEmail: string;
  message: string;
  school?: string;
  phone?: string;
}): Promise<EmailSendResult> {
  const contactEmail = process.env.CONTACT_EMAIL ?? "contact@blockchainist.id.vn";
  return sendConfiguredEmail({
    to: contactEmail,
    replyTo: params.applicantEmail,
    subject: `New contact form submission from ${params.applicantName}`,
    text: [
      `You received a new message via the Blockchainist contact form.`,
      ``,
      `Applicant: ${params.applicantName} <${params.applicantEmail}>`,
      params.school ? `School: ${params.school}` : null,
      params.phone ? `Phone: ${params.phone}` : null,
      ``,
      `Message:`,
      params.message,
      ``,
      `Application ID: ${params.applicationId}`,
      `Status: pending`
    ]
      .filter(Boolean)
      .join("\n")
  });
}

export function sendAccountInvitation(params: { email: string; resetLink: string }): Promise<EmailSendResult> {
  return sendConfiguredEmail({
    to: params.email,
    subject: "Set your Blockchainist account password",
    text: [
      "An account has been created for you in the Blockchainist research portal.",
      "",
      "Use the secure link below to set your password:",
      params.resetLink,
      "",
      "If you were not expecting this email, you can ignore it."
    ].join("\n")
  });
}

export function sendPasswordReset(params: { email: string; resetLink: string }): Promise<EmailSendResult> {
  return sendConfiguredEmail({
    to: params.email,
    subject: "Reset your Blockchainist account password",
    text: [
      "A password reset was requested for your Blockchainist research portal account.",
      "",
      "Use the secure link below to choose a new password:",
      params.resetLink,
      "",
      "If you did not request this, you can ignore this email."
    ].join("\n")
  });
}
