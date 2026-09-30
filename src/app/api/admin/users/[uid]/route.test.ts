import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const updateUser = vi.fn();
  const generatePasswordResetLink = vi.fn();
  const userSet = vi.fn();
  const getAdminDb = vi.fn(() => ({
    collection: (name: string) => ({
      doc: (id: string) => ({
        id,
        get: vi.fn().mockResolvedValue({ exists: name === "users", data: () => ({ email: "member@example.com", role: "member", status: "active", memberId: "member-1" }) }),
        set: userSet
      }),
      where: () => ({ limit: () => ({ get: vi.fn().mockResolvedValue({ empty: true, docs: [] }) }) })
    })
  }));
  const getAdminAuth = vi.fn(() => ({ updateUser, generatePasswordResetLink }));
  const sendPasswordReset = vi.fn();
  const session = { uid: "owner-1", email: "owner@example.com", role: "owner" as "owner" | "admin", status: "active" as const, memberId: null };
  return { updateUser, generatePasswordResetLink, userSet, getAdminDb, getAdminAuth, sendPasswordReset, session };
});

vi.mock("@/lib/firebase/admin", () => ({ getAdminDb: mocks.getAdminDb, getAdminAuth: mocks.getAdminAuth }));
vi.mock("@/lib/api/auth", () => ({ requireAdmin: async () => mocks.session, isAuthError: (value: unknown) => value instanceof Response, jsonError: (message: string, status: number) => Response.json({ error: message }, { status }) }));
vi.mock("@/lib/email/notifications", () => ({ sendPasswordReset: mocks.sendPasswordReset }));

import { PATCH } from "./route";

function request(body: Record<string, unknown>) {
  return new Request("https://example.com/api/admin/users/member-user", { method: "PATCH", body: JSON.stringify(body) });
}

describe("PATCH /api/admin/users/[uid]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateUser.mockResolvedValue(undefined);
    mocks.userSet.mockResolvedValue(undefined);
    mocks.generatePasswordResetLink.mockResolvedValue("https://firebase.example/reset");
    mocks.sendPasswordReset.mockResolvedValue({ ok: true, id: "email-id" });
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps Firebase Auth disabled state and Firestore status in sync", async () => {
    const response = await PATCH(request({ status: "inactive" }), { params: { uid: "member-user" } });

    expect(response.status).toBe(200);
    expect(mocks.updateUser).toHaveBeenCalledWith("member-user", { disabled: true });
    expect(mocks.userSet).toHaveBeenCalledWith(expect.objectContaining({ status: "inactive" }), { merge: true });
  });

  it("rejects the removed role field", async () => {
    const response = await PATCH(request({ role: "admin" }), { params: { uid: "member-user" } });

    expect(response.status).toBe(400);
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("sends the member a reset link through the configured mail service", async () => {
    const response = await PATCH(request({ sendReset: true }), { params: { uid: "member-user" } });

    expect(response.status).toBe(200);
    expect(mocks.generatePasswordResetLink).toHaveBeenCalledWith("member@example.com", undefined);
    expect(mocks.sendPasswordReset).toHaveBeenCalledWith({
      email: "member@example.com",
      resetLink: "https://firebase.example/reset"
    });
    expect(await response.json()).toMatchObject({ data: { invitationSent: true } });
  });
});
