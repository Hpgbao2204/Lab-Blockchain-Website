import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const createUser = vi.fn();
  const deleteUser = vi.fn();
  const generatePasswordResetLink = vi.fn();
  const batchCreate = vi.fn();
  const batchCommit = vi.fn();
  const linked = { value: false };
  const memberExists = { value: true };
  const getAdminDb = vi.fn(() => ({
    collection: (name: string) => ({
      doc: (id?: string) => ({ id: id ?? "new-member", get: vi.fn().mockResolvedValue({ exists: name === "members" ? memberExists.value : false }) }),
      where: () => ({ limit: () => ({ get: vi.fn().mockResolvedValue({ empty: !linked.value, docs: linked.value ? [{ id: "existing-user" }] : [] }) }) }),
      orderBy: () => ({ get: vi.fn().mockResolvedValue({ docs: [] }) })
    }),
    batch: () => ({ create: batchCreate, commit: batchCommit })
  }));
  const getAdminAuth = vi.fn(() => ({ createUser, deleteUser, generatePasswordResetLink }));
  const sendAccountInvitation = vi.fn();
  const session = { uid: "owner-1", email: "owner@example.com", role: "owner" as const, status: "active" as const, memberId: null };
  return { createUser, deleteUser, generatePasswordResetLink, batchCreate, batchCommit, linked, memberExists, getAdminDb, getAdminAuth, sendAccountInvitation, session };
});

vi.mock("@/lib/firebase/admin", () => ({ getAdminDb: mocks.getAdminDb, getAdminAuth: mocks.getAdminAuth }));
vi.mock("@/lib/api/auth", () => ({ requireAdmin: async () => mocks.session, isAuthError: (value: unknown) => value instanceof Response, jsonError: (message: string, status: number) => Response.json({ error: message }, { status }) }));
vi.mock("@/lib/email/notifications", () => ({ sendAccountInvitation: mocks.sendAccountInvitation }));

import { POST } from "./route";

function request(body: Record<string, unknown>) {
  return new Request("https://example.com/api/admin/users", { method: "POST", body: JSON.stringify(body) });
}

describe("POST /api/admin/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.linked.value = false;
    mocks.memberExists.value = true;
    mocks.createUser.mockResolvedValue({ uid: "firebase-user" });
    mocks.batchCommit.mockResolvedValue(undefined);
    mocks.generatePasswordResetLink.mockResolvedValue("https://reset.example.com");
    mocks.sendAccountInvitation.mockResolvedValue({ ok: true, id: "email-id" });
  });

  it("creates an Auth user, one linked user record, and a reset invitation", async () => {
    const response = await POST(request({ email: "member@example.com", memberId: "member-1" }));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ data: { uid: "firebase-user", email: "member@example.com", memberId: "member-1", invitationSent: true } });
    expect(mocks.createUser).toHaveBeenCalledWith(expect.objectContaining({ email: "member@example.com", disabled: false }));
    expect(mocks.batchCreate).toHaveBeenCalledTimes(1);
    expect(mocks.sendAccountInvitation).toHaveBeenCalledWith({ email: "member@example.com", resetLink: "https://reset.example.com" });
  });

  it("rejects an already-linked member profile before creating an Auth user", async () => {
    mocks.linked.value = true;

    const response = await POST(request({ email: "member@example.com", memberId: "member-1" }));

    expect(response.status).toBe(409);
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it("creates a private active profile for a newly provisioned member", async () => {
    const response = await POST(
      request({
        email: "member@example.com",
        member: { name: "New Member", slug: "new-member", role: "Research member" }
      })
    );

    expect(response.status).toBe(201);
    expect(mocks.batchCreate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ isActive: true, isPublic: false })
    );
  });
});
