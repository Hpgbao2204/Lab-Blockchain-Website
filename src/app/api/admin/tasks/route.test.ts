import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const add = vi.fn(async (value: Record<string, unknown>) => {
    mocks.created = value;
    return { id: "task-1" };
  });
  const get = vi.fn(async () => ({ exists: true, id: "task-1", data: () => mocks.created }));
  return {
    add,
    get,
    created: {} as Record<string, unknown>,
    getAdminDb: vi.fn(() => ({})),
    getTasksCollection: vi.fn(() => ({ add, orderBy: () => ({ get: async () => ({ docs: [] }) }) })),
    getTaskRef: vi.fn(() => ({ get })),
    getTeamRef: vi.fn(() => ({ get: async () => ({ exists: true, id: "wall-1", data: () => ({}) }) })),
    serializeTeam: vi.fn(() => ({ id: "wall-1", memberIds: ["member-1"], isActive: true })),
    getActiveWallMemberIds: vi.fn(),
    session: { uid: "owner-uid", email: "owner@example.com", role: "owner" as const, status: "active" as const, memberId: null },
  };
});

vi.mock("@/lib/firebase/admin", () => ({ getAdminDb: mocks.getAdminDb }));
vi.mock("@/lib/api/tasks", () => ({
  getTaskRef: mocks.getTaskRef,
  getTasksCollection: mocks.getTasksCollection,
  serializeTask: (id: string, data: Record<string, unknown>) => ({ id, ...data }),
}));
vi.mock("@/lib/api/teams", () => ({
  getTeamRef: mocks.getTeamRef,
  serializeTeam: mocks.serializeTeam,
  getActiveWallMemberIds: mocks.getActiveWallMemberIds,
}));
vi.mock("@/lib/api/auth", () => ({
  requireAdmin: async () => mocks.session,
  isAuthError: (value: unknown) => value instanceof Response,
  jsonError: (message: string, status: number) => Response.json({ error: message }, { status }),
}));
vi.mock("firebase-admin/firestore", () => ({ FieldValue: { serverTimestamp: () => "timestamp" } }));

import { POST } from "./route";

function request() {
  return new Request("https://example.com/api/admin/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ teamId: "wall-1", title: "Prepare benchmark report" }),
  });
}

describe("POST /api/admin/tasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.created = {};
    mocks.getActiveWallMemberIds.mockResolvedValue(["member-1"]);
  });

  it("assigns every active Wall member without accepting client assignees", async () => {
    const response = await POST(request());

    expect(response.status).toBe(201);
    expect(mocks.add).toHaveBeenCalledWith(expect.objectContaining({
      status: "in_progress",
      assigneeMemberIds: ["member-1"],
    }));
  });

  it("explains why a task cannot be created for a Wall without active accounts", async () => {
    mocks.getActiveWallMemberIds.mockResolvedValue([]);

    const response = await POST(request());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Wall cần ít nhất một thành viên đang hoạt động có tài khoản trước khi tạo công việc.",
    });
    expect(mocks.add).not.toHaveBeenCalled();
  });
});
