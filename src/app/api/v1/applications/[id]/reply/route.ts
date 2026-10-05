import { body, route } from "@/lib/api/handler";
import { siteUrl } from "@/server/jobs/weekly-digest";
import { sendMails } from "@/server/mail";
import { replyToApplication } from "@/server/services/applications";
import { applicationReplyInput } from "@/server/validation";

/**
 * Admin: email everyone on the application a message (Reply-To the admin) and set the status it
 * decides: `accepted`, `declined`, or `contacted` for a plain answer. With `accepted` and
 * `createAccounts`, each person also gets an account and a welcome email with their login.
 */
export const POST = route<{ id: string }>(async ({ db, user, req, params }) =>
  replyToApplication(db, user, params.id, await body(req, applicationReplyInput), { send: sendMails, siteUrl: siteUrl() }),
);
