import { FieldValue } from "firebase-admin/firestore";
import { jsonError } from "@/lib/api/auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { sendApplicationNotification } from "@/lib/email/notifications";
import { verifyTurnstile } from "@/lib/turnstile";
import { parseApplicationSubmission } from "@/lib/validation/application";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  let submission;
  try {
    submission = parseApplicationSubmission(body);
  } catch {
    return jsonError("Invalid application input", 400);
  }

  const turnstile = await verifyTurnstile(submission.turnstileToken);
  if (!turnstile.valid) {
    return jsonError(turnstile.reason, turnstile.unavailable ? 503 : 400);
  }

  const db = getAdminDb();
  if (!db) {
    return jsonError("Firebase Admin is not configured", 503);
  }

  const doc = await db.collection("applications").add({
    ...submission.application,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  });

  const emailResult = await sendApplicationNotification({
    applicationId: doc.id,
    applicantName: submission.application.name,
    applicantEmail: submission.application.email,
    message: submission.application.message,
    school: submission.application.school,
    phone: submission.application.phone
  });

  if (!emailResult.ok) {
    console.error("Failed to send application notification email:", emailResult.error.message);
  }

  return Response.json({ data: { id: doc.id } }, { status: 201 });
}
