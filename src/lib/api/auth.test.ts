import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  getAdminAuth,
  getAdminDb,
  verifyIdToken,
  userDocGet,
  userDocSet
} = vi.hoisted(() => {
  const verifyIdToken = vi.fn();
  const userDocGet = vi.fn();
  const userDocSet = vi.fn().mockResolvedValue(undefined);

  const getAdminAuth = vi.fn(() => ({ verifyIdToken }));
  const getAdminDb = vi.fn(() => ({
    collection: (name: string) => {
      if (name === "users") {
        return {
          doc: () => ({
            get: userDocGet,
            set: userDocSet
          })
        };
      }
      return { doc: () => ({ get: vi.fn(), set: vi.fn() }) };
    }
  }));

  return { getAdminAuth, getAdminDb, verifyIdToken, userDocGet, userDocSet };
});

vi.mock("@/lib/firebase/admin", () => ({
  getAdminAuth,
  getAdminDb
}));

import { requireAdmin, requireMemberOwnership, requireUser } from "./auth";

function makeRequest(token?: string) {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return new Request("https://example.com/api/admin/members", { headers });
}

function mockUser(role: "owner" | "admin" | "member", status: "active" | "inactive" | "pending", memberId: string | null = null, email = "user@example.com") {
  userDocGet.mockResolvedValue({
    exists: true,
    data: () => ({
      email,
      role,
      status,
      memberId
    })
  });
}

function mockNoUser() {
  userDocGet.mockResolvedValue({ exists: false, data: () => undefined });
}

function isAuthError(value: unknown): value is Response {
  return value instanceof Response;
}

describe("requireUser", () => {
  beforeEach(() => {
    process.env.OWNER_EMAIL = "admin@example.com";
    verifyIdToken.mockReset();
    userDocGet.mockReset();
    userDocSet.mockReset();
  });

  afterEach(() => {
    delete process.env.OWNER_EMAIL;
  });

  it("returns a 401 response when the Authorization header is missing", async () => {
    const response = await requireUser(makeRequest());

    expect(isAuthError(response)).toBe(true);
    expect((response as Response).status).toBe(401);
    await expect((response as Response).json()).resolves.toEqual({ error: "Missing Firebase ID token" });
  });

  it("returns a 401 response for an invalid Firebase ID token", async () => {
    verifyIdToken.mockRejectedValue(new Error("invalid token"));

    const response = await requireUser(makeRequest("invalid-token"));

    expect(isAuthError(response)).toBe(true);
    expect((response as Response).status).toBe(401);
    await expect((response as Response).json()).resolves.toEqual({ error: "Invalid Firebase ID token" });
  });

  it("returns a 403 response when a user has no record and is not the configured owner", async () => {
    verifyIdToken.mockResolvedValue({ uid: "member-id", email: "member@example.com" });
    mockNoUser();

    const response = await requireUser(makeRequest("member-token"));

    expect(isAuthError(response)).toBe(true);
    expect((response as Response).status).toBe(403);
    await expect((response as Response).json()).resolves.toEqual({ error: "Access is required" });
    expect(userDocSet).not.toHaveBeenCalled();
  });

  it("bootstraps the configured owner record and returns a session", async () => {
    verifyIdToken.mockResolvedValue({
      uid: "admin-id",
      email: "admin@example.com",
      email_verified: true
    });
    mockNoUser();

    const session = await requireUser(makeRequest("admin-token"));

    expect(isAuthError(session)).toBe(false);
    expect(session).toEqual({
      uid: "admin-id",
      email: "admin@example.com",
      role: "owner",
      status: "active",
      memberId: null
    });
    expect(userDocSet).toHaveBeenCalledWith(
      expect.objectContaining({
        uid: "admin-id",
        email: "admin@example.com",
        role: "owner",
        status: "active",
        memberId: null
      })
    );
  });

  it("does not bootstrap an owner from an unverified email", async () => {
    verifyIdToken.mockResolvedValue({
      uid: "admin-id",
      email: "admin@example.com",
      email_verified: false
    });
    mockNoUser();

    const response = await requireUser(makeRequest("admin-token"));

    expect(isAuthError(response)).toBe(true);
    expect((response as Response).status).toBe(403);
    expect(userDocSet).not.toHaveBeenCalled();
  });

  it("does not bootstrap another email as owner", async () => {
    process.env.OWNER_EMAIL = "admin@example.com";
    verifyIdToken.mockResolvedValue({
      uid: "legacy-admin-id",
      email: "legacy-admin@example.com"
    });
    mockNoUser();

    const response = await requireUser(makeRequest("legacy-admin-token"));

    expect(isAuthError(response)).toBe(true);
    expect((response as Response).status).toBe(403);
    expect(userDocSet).not.toHaveBeenCalled();
  });

  it("returns a session for an active user with a Firestore record", async () => {
    verifyIdToken.mockResolvedValue({ uid: "member-id", email: "member@example.com" });
    mockUser("member", "active", "member-1");

    const session = await requireUser(makeRequest("member-token"));

    expect(verifyIdToken).toHaveBeenCalledWith("member-token", true);
    expect(session).toEqual({
      uid: "member-id",
      email: "user@example.com",
      role: "member",
      status: "active",
      memberId: "member-1"
    });
  });

  it("rejects legacy admin and owner records before migration", async () => {
    verifyIdToken.mockResolvedValue({ uid: "legacy-id", email: "legacy@example.com" });
    mockUser("admin", "active");
    expect((await requireUser(makeRequest("legacy-token")) as Response).status).toBe(403);

    mockUser("owner", "active", null, "legacy@example.com");
    expect((await requireUser(makeRequest("legacy-token")) as Response).status).toBe(403);
  });

  it("returns a 403 response for an inactive user", async () => {
    verifyIdToken.mockResolvedValue({ uid: "member-id", email: "member@example.com" });
    mockUser("member", "inactive", "member-1");

    const response = await requireUser(makeRequest("member-token"));

    expect(isAuthError(response)).toBe(true);
    expect((response as Response).status).toBe(403);
    await expect((response as Response).json()).resolves.toEqual({ error: "Account is not active" });
  });

  it("returns a 403 response when the token has no email", async () => {
    verifyIdToken.mockResolvedValue({ uid: "no-email-id" });

    const response = await requireUser(makeRequest("no-email-token"));

    expect(isAuthError(response)).toBe(true);
    expect((response as Response).status).toBe(403);
    await expect((response as Response).json()).resolves.toEqual({ error: "Email is required" });
  });
});

describe("requireAdmin", () => {
  beforeEach(() => {
    process.env.OWNER_EMAIL = "admin@example.com";
    verifyIdToken.mockReset();
    userDocGet.mockReset();
  });

  afterEach(() => {
    delete process.env.OWNER_EMAIL;
  });

  it("allows an owner", async () => {
    process.env.OWNER_EMAIL = "owner@example.com";
    verifyIdToken.mockResolvedValue({ uid: "owner-id", email: "owner@example.com" });
    mockUser("owner", "active", null, "owner@example.com");

    const session = await requireAdmin(makeRequest("owner-token"));

    expect(isAuthError(session)).toBe(false);
    expect((session as { role: string }).role).toBe("owner");
  });

  it("denies the legacy admin role", async () => {
    verifyIdToken.mockResolvedValue({ uid: "admin-id", email: "admin@example.com" });
    mockUser("admin", "active");

    const session = await requireAdmin(makeRequest("admin-token"));

    expect(isAuthError(session)).toBe(true);
    expect((session as Response).status).toBe(403);
  });

  it("returns a 403 response for a member", async () => {
    verifyIdToken.mockResolvedValue({ uid: "member-id", email: "member@example.com" });
    mockUser("member", "active", "member-1");

    const response = await requireAdmin(makeRequest("member-token"));

    expect(isAuthError(response)).toBe(true);
    expect((response as Response).status).toBe(403);
    await expect((response as Response).json()).resolves.toEqual({ error: "Admin access is required" });
  });
});

describe("requireMemberOwnership", () => {
  beforeEach(() => {
    process.env.OWNER_EMAIL = "admin@example.com";
    verifyIdToken.mockReset();
    userDocGet.mockReset();
  });

  afterEach(() => {
    delete process.env.OWNER_EMAIL;
  });

  it("allows a member to access their own record", async () => {
    verifyIdToken.mockResolvedValue({ uid: "member-id", email: "member@example.com" });
    mockUser("member", "active", "member-1");

    const session = await requireMemberOwnership(makeRequest("member-token"), "member-1");

    expect(isAuthError(session)).toBe(false);
  });

  it("denies a member access to another member's record", async () => {
    verifyIdToken.mockResolvedValue({ uid: "member-id", email: "member@example.com" });
    mockUser("member", "active", "member-1");

    const response = await requireMemberOwnership(makeRequest("member-token"), "member-2");

    expect(isAuthError(response)).toBe(true);
    expect((response as Response).status).toBe(403);
    await expect((response as Response).json()).resolves.toEqual({ error: "Access to this member record is required" });
  });

  it("allows an owner to access any member record", async () => {
    process.env.OWNER_EMAIL = "owner@example.com";
    verifyIdToken.mockResolvedValue({ uid: "owner-id", email: "owner@example.com" });
    mockUser("owner", "active", null, "owner@example.com");

    const session = await requireMemberOwnership(makeRequest("owner-token"), "member-2");

    expect(isAuthError(session)).toBe(false);
  });

  it("denies the legacy admin role access to member records", async () => {
    verifyIdToken.mockResolvedValue({ uid: "admin-id", email: "admin@example.com" });
    mockUser("admin", "active");

    const session = await requireMemberOwnership(makeRequest("admin-token"), "member-2");

    expect(isAuthError(session)).toBe(true);
    expect((session as Response).status).toBe(403);
  });
});
