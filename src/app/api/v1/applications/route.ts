import { body, route } from "@/lib/api/handler";
import { rateLimit } from "@/server/auth/rate-limit";
import { verifyCaptcha } from "@/server/captcha";
import { AppError } from "@/server/errors";
import { notifyApplication } from "@/server/jobs/notify";
import { listApplications, recentApplicationCount, submitApplication } from "@/server/services/applications";
import { applicationInput } from "@/server/validation";

/** Above this many applications in an hour (from anywhere), admins stop getting an email for each. */
const MAIL_FLOOD_LIMIT = 20;

/** Admin: every application, newest first. */
export const GET = route(async ({ db, user }) => listApplications(db, user));

/**
 * Public: the Join form. It passes the captcha (when configured), then at most 3 per address per
 * hour; admins get an email for each one unless the form is being flooded.
 */
export const POST = route(
  async ({ db, req }) => {
    const input = await body(req, applicationInput);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null;
    const captcha = await verifyCaptcha(input.captcha, ip);
    if (!captcha.ok) throw new AppError("invalid_input", captcha.reason);
    if (!(await rateLimit(db, `apply:${ip ?? "local"}`, 3, 60 * 60_000))) throw new AppError("rate_limited", "Too many applications from here. Try again later or email the PI.");
    const application = await submitApplication(db, input);
    if (application && (await recentApplicationCount(db, 60 * 60_000)) <= MAIL_FLOOD_LIMIT) {
      await notifyApplication(db, application).catch((e) => console.error("[applications] email failed:", e));
    }
    return { received: true };
  },
  { allowPasswordChange: true },
);
