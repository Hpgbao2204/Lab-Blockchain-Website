import { body, route } from "@/lib/api/handler";
import { rateLimit } from "@/server/auth/rate-limit";
import { AppError } from "@/server/errors";
import { notifyApplication } from "@/server/jobs/notify";
import { listApplications, submitApplication } from "@/server/services/applications";
import { applicationInput } from "@/server/validation";

/** Admin: every application, newest first. */
export const GET = route(async ({ db, user }) => listApplications(db, user));

/** Public: the Join form. At most 3 per address per hour; admins get an email for each one. */
export const POST = route(
  async ({ db, req }) => {
    const input = await body(req, applicationInput);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
    if (!(await rateLimit(db, `apply:${ip}`, 3, 60 * 60_000))) throw new AppError("rate_limited", "Too many applications from here. Try again later or email the PI.");
    const application = await submitApplication(db, input);
    if (application) await notifyApplication(db, application).catch((e) => console.error("[applications] email failed:", e));
    return { received: true };
  },
  { allowPasswordChange: true },
);
