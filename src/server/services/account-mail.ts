import type { Mail } from "../mail";
import { button, esc, shell } from "./meetings";

export type AccountMailKind = "welcome" | "reset";

/**
 * Login details for a new account (or a reset password), sent to the address the account signs in
 * with. Vietnamese, as the PI asked: it goes to UIT students. The password is temporary; the site
 * makes them choose their own at first sign-in.
 */
export function renderAccountMail(to: { name: string; email: string }, password: string, siteUrl: string, kind: AccountMailKind): Mail {
  const login = `${siteUrl}/login`;
  const subject = kind === "welcome" ? "[Blockchainist] Tài khoản thử nghiệm Beta của em" : "[Blockchainist] Mật khẩu tạm mới";
  const intro =
    kind === "welcome"
      ? "Hệ thống Website Blockchainist đi vào quá trình thử nghiệm Beta. Thầy đã tạo tài khoản cho em:"
      : "Mật khẩu tài khoản Blockchainist của em vừa được đặt lại. Thông tin đăng nhập mới:";
  const steps = "Mời em bấm vào link dưới đây để đăng nhập, kích hoạt tài khoản (đặt mật khẩu riêng), rồi cập nhật hồ sơ cá nhân và vào wall làm việc của nhóm.";
  const text = [
    `Thân chào ${to.name},`,
    "",
    intro,
    "",
    `Username: ${to.email}`,
    `Mật khẩu tạm: ${password}`,
    "",
    steps,
    login,
    "",
    "Mật khẩu tạm chỉ dùng cho lần đăng nhập đầu tiên.",
    "",
    "Blockchainist Research Group · UIT – VNU-HCM",
  ].join("\n");
  const html = shell(
    `<p style="font:700 20px/1.2 Arial,sans-serif">Thân chào ${esc(to.name)},</p>` +
      `<p>${intro}</p>` +
      `<table style="margin:12px 0;padding:12px 16px;border:2px solid #16140f;border-radius:12px;background:#fff;font:15px Arial,sans-serif"><tr><td style="padding:3px 14px 3px 0;color:#555">Username</td><td style="padding:3px 0"><b>${esc(to.email)}</b></td></tr><tr><td style="padding:3px 14px 3px 0;color:#555">Mật khẩu tạm</td><td style="padding:3px 0;font-family:monospace;font-size:16px"><b>${esc(password)}</b></td></tr></table>` +
      `<p>${steps}</p>` +
      `<p style="margin-top:16px">${button(login, "Đăng nhập và kích hoạt")}</p>` +
      `<p style="font-size:13px;color:#555">Mật khẩu tạm chỉ dùng cho lần đăng nhập đầu tiên.</p>`,
    "Blockchainist Research Group · UIT – VNU-HCM",
  );
  return { to: to.email, subject, text, html };
}
