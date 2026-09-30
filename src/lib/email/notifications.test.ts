import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

import { sendApplicationNotification, sendPasswordReset } from "./notifications";

describe("sendApplicationNotification", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "email-id" })
    });
    vi.stubEnv("RESEND_API_KEY", "resend-key");
    vi.stubEnv("RESEND_FROM_EMAIL", "Blockchainist <contact@blockchainist.id.vn>");
    vi.stubEnv("FROM_EMAIL", "");
    vi.stubEnv("CONTACT_EMAIL", "contact@blockchainist.id.vn");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("uses the configured verified sender", async () => {
    await expect(
      sendApplicationNotification({
        applicationId: "application-id",
        applicantName: "Student Name",
        applicantEmail: "student@example.com",
        message: "I want to join the research group."
      })
    ).resolves.toEqual({ ok: true, id: "email-id" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("contact@blockchainist.id.vn")
      })
    );
  });

  it("does not send without a configured sender", async () => {
    vi.stubEnv("RESEND_FROM_EMAIL", "");
    vi.stubEnv("FROM_EMAIL", "");

    const result = await sendApplicationNotification({
      applicationId: "application-id",
      applicantName: "Student Name",
      applicantEmail: "student@example.com",
      message: "I want to join the research group."
    });

    expect(result).toEqual({ ok: false, error: new Error("Resend sender email is not configured") });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("supports the deployed FROM_EMAIL sender name", async () => {
    vi.stubEnv("RESEND_FROM_EMAIL", "");
    vi.stubEnv("FROM_EMAIL", "Blockchainist <contact@blockchainist.id.vn>");

    await sendApplicationNotification({
      applicationId: "application-id",
      applicantName: "Student Name",
      applicantEmail: "student@example.com",
      message: "I want to join the research group."
    });

    const [, options] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1] as [
      string,
      RequestInit,
    ];
    expect(JSON.parse(String(options.body))).toMatchObject({
      from: "Blockchainist <contact@blockchainist.id.vn>",
    });
  });

  it("sends password resets with the configured sender", async () => {
    await expect(
      sendPasswordReset({ email: "member@example.com", resetLink: "https://firebase.example/reset" })
    ).resolves.toEqual({ ok: true, id: "email-id" });

    const [, options] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1] as [
      string,
      RequestInit,
    ];
    expect(JSON.parse(String(options.body))).toMatchObject({
      from: "Blockchainist <contact@blockchainist.id.vn>",
      to: "member@example.com",
      subject: "Reset your Blockchainist account password",
    });
  });
});
