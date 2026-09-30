import { z } from "zod";
import { getAdminAuth } from "@/lib/firebase/admin";
import { jsonError } from "@/lib/api/auth";
import { sendPasswordReset } from "@/lib/email/notifications";

const passwordResetSchema = z.object({
  email: z.string().trim().email().max(320)
});

function portalUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!value) return undefined;
  try {
    return new URL("/portal", value).toString();
  } catch {
    return undefined;
  }
}

function isUserNotFound(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "auth/user-not-found");
}

export async function POST(request: Request) {
  let input;
  try {
    input = passwordResetSchema.parse(await request.json());
  } catch {
    return jsonError("Email không hợp lệ", 400);
  }

  const auth = getAdminAuth();
  if (!auth) return jsonError("Firebase Admin is not configured", 503);

  try {
    const user = await auth.getUserByEmail(input.email);
    if (user.disabled) return Response.json({ data: { sent: false } });

    const continueUrl = portalUrl();
    const resetLink = await auth.generatePasswordResetLink(
      input.email,
      continueUrl ? { url: continueUrl } : undefined,
    );
    const result = await sendPasswordReset({ email: input.email, resetLink });
    if (!result.ok) {
      return jsonError("Không thể gửi email đặt lại mật khẩu", 503);
    }
  } catch (error) {
    if (!isUserNotFound(error)) {
      return jsonError("Không thể gửi email đặt lại mật khẩu", 503);
    }
  }

  // Do not disclose whether the address belongs to an active account.
  return Response.json({ data: { sent: true } });
}
