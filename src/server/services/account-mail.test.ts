import { describe, expect, it } from "vitest";
import { renderAccountMail } from "./account-mail";

describe("account email", () => {
  const to = { name: "Nguyễn <Văn> An", email: "23520001@gm.uit.edu.vn" };

  it("carries the username, temporary password and login link", () => {
    const m = renderAccountMail(to, "Temp-pass-123", "https://blockchainist.id.vn", "welcome");
    expect(m.to).toBe("23520001@gm.uit.edu.vn");
    expect(m.subject).toContain("Beta");
    for (const part of ["23520001@gm.uit.edu.vn", "Temp-pass-123", "https://blockchainist.id.vn/login"]) {
      expect(m.text).toContain(part);
      expect(m.html).toContain(part);
    }
  });

  it("escapes the name and says when a password was reset", () => {
    const m = renderAccountMail(to, "x", "https://blockchainist.id.vn", "reset");
    expect(m.html).not.toContain("<Văn>");
    expect(m.subject).toContain("Mật khẩu tạm mới");
  });
});
