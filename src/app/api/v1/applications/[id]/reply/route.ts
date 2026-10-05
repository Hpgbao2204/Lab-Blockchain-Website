import { body, route } from "@/lib/api/handler";
import { sendMails } from "@/server/mail";
import { replyToApplication } from "@/server/services/applications";
import { applicationReplyInput } from "@/server/validation";

/**
 * Admin: email the applicant a message (Reply-To the admin) and set the status it decides:
 * `accepted`, `declined`, or `contacted` for a plain answer. The message is kept on the application.
 */
export const POST = route<{ id: string }>(async ({ db, user, req, params }) =>
  replyToApplication(db, user, params.id, await body(req, applicationReplyInput), (mail) => sendMails([mail])),
);
