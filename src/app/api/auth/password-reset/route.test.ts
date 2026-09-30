import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const getUserByEmail = vi.fn();
  const generatePasswordResetLink = vi.fn();
  const getAdminAuth = vi.fn(() => ({ getUserByEmail, generatePasswordResetLink }));
  const sendPasswordReset = vi.fn();
  return { getUserByEmail, generatePasswordResetLink, getAdminAuth, sendPasswordReset };
});

vi.mock("@/lib/firebase/admin", () => ({ getAdminAuth: mocks.getAdminAuth }));
vi.mock("@/lib/email/notifications", () => ({ sendPasswordReset: mocks.sendPasswordReset }));

import { POST } from "./route";

function request(email: string) {
  return new Request("https://example.com/api/auth/password-reset", {
    method: "POST",
    body: JSON.stringify({ email })
  });
}

describe("POST /api/auth/password-reset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://blockchainist.id.vn");
    mocks.getUserByEmail.mockResolvedValue({ disabled: false });
    mocks.generatePasswordResetLink.mockResolvedValue("https://firebase.example/reset");
    mocks.sendPasswordReset.mockResolvedValue({ ok: true, id: "email-id" });
  });

  it("generates a portal reset link and sends it through Resend", async () => {
    const response = await POST(request("member@example.com"));

    expect(response.status).toBe(200);
    expect(mocks.generatePasswordResetLink).toHaveBeenCalledWith("member@example.com", {
      url: "https://blockchainist.id.vn/portal"
    });
    expect(mocks.sendPasswordReset).toHaveBeenCalledWith({
      email: "member@example.com",
      resetLink: "https://firebase.example/reset"
    });
  });

  it("does not disclose an unknown email address", async () => {
    mocks.getUserByEmail.mockRejectedValue({ code: "auth/user-not-found" });

    const response = await POST(request("missing@example.com"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { sent: true } });
    expect(mocks.sendPasswordReset).not.toHaveBeenCalled();
  });

  it("returns an error when the configured mail sender cannot send", async () => {
    mocks.sendPasswordReset.mockResolvedValue({ ok: false, error: new Error("sender unavailable") });

    const response = await POST(request("member@example.com"));

    expect(response.status).toBe(503);
  });
});
