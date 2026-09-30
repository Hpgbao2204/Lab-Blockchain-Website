import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const addApplication = vi.fn();
const verifyTurnstile = vi.fn();
const sendApplicationNotification = vi.fn();

vi.mock("@/lib/firebase/admin", () => ({
  getAdminDb: () => ({
    collection: (name: string) => {
      expect(name).toBe("applications");
      return {
        add: addApplication
      };
    }
  })
}));

vi.mock("@/lib/turnstile", () => ({ verifyTurnstile }));
vi.mock("@/lib/email/notifications", () => ({ sendApplicationNotification }));

describe("POST /api/applications", () => {
  beforeEach(() => {
    addApplication.mockReset();
    addApplication.mockResolvedValue({ id: "application-id" });
    verifyTurnstile.mockReset();
    verifyTurnstile.mockResolvedValue({ valid: true });
    sendApplicationNotification.mockReset();
    sendApplicationNotification.mockResolvedValue({ ok: true, id: "email-id" });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("validates, writes, and sends a notification email", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("https://example.com/api/applications", {
        method: "POST",
        body: JSON.stringify({
          name: "Tran Thi B",
          email: "student@example.com",
          school: "UIT",
          phone: "0900000000",
          message: "I want to join blockchain research.",
          turnstileToken: "turnstile-token"
        })
      })
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      data: {
        id: "application-id"
      }
    });
    expect(addApplication).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Tran Thi B",
        email: "student@example.com",
        school: "UIT",
        phone: "0900000000",
        message: "I want to join blockchain research.",
        status: "pending",
        source: "website_contact_form"
      })
    );
    expect(sendApplicationNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        applicationId: "application-id",
        applicantName: "Tran Thi B",
        applicantEmail: "student@example.com",
        message: "I want to join blockchain research.",
        school: "UIT",
        phone: "0900000000"
      })
    );
  });

  it("still returns 201 when the notification email fails", async () => {
    sendApplicationNotification.mockResolvedValue({
      ok: false,
      error: new Error("Resend API error")
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("https://example.com/api/applications", {
        method: "POST",
        body: JSON.stringify({
          name: "Tran Thi B",
          email: "student@example.com",
          message: "I want to join blockchain research.",
          turnstileToken: "turnstile-token"
        })
      })
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      data: { id: "application-id" }
    });
    expect(console.error).toHaveBeenCalledWith(
      "Failed to send application notification email:",
      "Resend API error"
    );
  });

  it("rejects an invalid Turnstile token before writing", async () => {
    verifyTurnstile.mockResolvedValue({ valid: false, reason: "Turnstile verification failed" });
    const { POST } = await import("./route");
    const response = await POST(
      new Request("https://example.com/api/applications", {
        method: "POST",
        body: JSON.stringify({
          name: "Tran Thi B",
          email: "student@example.com",
          message: "I want to join blockchain research.",
          turnstileToken: "invalid-token"
        })
      })
    );

    expect(response.status).toBe(400);
    expect(addApplication).not.toHaveBeenCalled();
    expect(sendApplicationNotification).not.toHaveBeenCalled();
  });
});
