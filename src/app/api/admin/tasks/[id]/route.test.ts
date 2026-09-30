import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  let task: Record<string, unknown> = {};
  const set = vi.fn(async (update: Record<string, unknown>) => { task = { ...task, ...update }; });
  const get = vi.fn(async () => ({ exists: true, id: "task-1", data: () => task }));
  return {
    getAdminDb: vi.fn(() => ({})),
    getTaskRef: vi.fn(() => ({ get, set })),
    get,
    set,
    setTask: (value: Record<string, unknown>) => { task = value; },
    session: { uid: "owner-uid", email: "owner@example.com", role: "owner", status: "active", memberId: null } as unknown,
  };
});

vi.mock("@/lib/firebase/admin", () => ({ getAdminDb: mocks.getAdminDb }));
vi.mock("@/lib/api/tasks", () => ({ getTaskRef: mocks.getTaskRef, serializeTask: (id: string, data: Record<string, unknown>) => ({ id, ...data }) }));
vi.mock("@/lib/api/auth", () => ({
  requireAdmin: async () => mocks.session,
  isAuthError: (value: unknown) => value instanceof Response,
  jsonError: (message: string, status: number) => Response.json({ error: message }, { status }),
}));
vi.mock("firebase-admin/firestore", () => ({ FieldValue: { serverTimestamp: () => "timestamp" } }));

import { PATCH } from "./route";

const context = { params: Promise.resolve({ id: "task-1" }) };

describe("PATCH /api/admin/tasks/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.setTask({ teamId: "wall-1", title: "Draft", status: "in_progress", assigneeMemberIds: ["member-1"] });
    mocks.session = { uid: "owner-uid", email: "owner@example.com", role: "owner", status: "active", memberId: null };
  });

  it("allows the owner to set one of the three official statuses", async () => {
    const response = await PATCH(new Request("https://example.com/api/admin/tasks/task-1", { method: "PATCH", body: JSON.stringify({ status: "completed" }) }), context);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ data: { status: "completed" } });
  });

  it("does not let a non-owner change status", async () => {
    mocks.session = Response.json({ error: "Admin access is required" }, { status: 403 });

    const response = await PATCH(new Request("https://example.com/api/admin/tasks/task-1", { method: "PATCH", body: JSON.stringify({ status: "blocked" }) }), context);

    expect(response.status).toBe(403);
    expect(mocks.set).not.toHaveBeenCalled();
  });
});
