import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  let task: Record<string, unknown> = {};
  const taskRef = {
    id: "task-1",
    get: vi.fn(() => Promise.resolve({ exists: true, id: "task-1", data: () => task })),
  };
  const set = vi.fn((_: unknown, update: Record<string, unknown>) => Object.assign(task, update));
  const runTransaction = vi.fn(async (callback: (transaction: { get: (ref: unknown) => Promise<unknown>; set: typeof set }) => unknown) =>
    callback({ get: async () => ({ exists: true, data: () => task }), set }),
  );
  return {
    getAdminDb: vi.fn(() => ({ runTransaction })),
    getTaskRef: vi.fn(() => taskRef),
    getTeamAccess: vi.fn(),
    session: { uid: "member-uid", email: "member@example.com", role: "member" as const, status: "active" as const, memberId: "member-1" },
    setTask: (value: Record<string, unknown>) => { task = value; },
    set,
  };
});

vi.mock("@/lib/firebase/admin", () => ({ getAdminDb: mocks.getAdminDb }));
vi.mock("@/lib/api/tasks", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/lib/api/tasks")>()), getTaskRef: mocks.getTaskRef }));
vi.mock("@/lib/api/teams", () => ({ getTeamAccess: mocks.getTeamAccess }));
vi.mock("@/lib/api/auth", () => ({
  requireUser: async () => mocks.session,
  isAuthError: (value: unknown) => value instanceof Response,
  jsonError: (message: string, status: number) => Response.json({ error: message }, { status }),
}));
vi.mock("firebase-admin/firestore", () => ({ FieldValue: { serverTimestamp: () => "timestamp" } }));

import { POST } from "./route";

describe("POST /api/tasks/[id]/reaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.setTask({ teamId: "wall-1", title: "Task", status: "in_progress", likedByUids: [] });
    mocks.getTeamAccess.mockResolvedValue("member");
  });

  it("toggles the current member reaction without duplicating it", async () => {
    const request = new Request("https://example.com/api/tasks/task-1/reaction", { method: "POST" });

    const response = await POST(request, { params: { id: "task-1" } });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ data: { likedByUids: ["member-uid"] } });
    expect(mocks.set).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ likedByUids: ["member-uid"] }), { merge: true });
  });

  it("rejects a member outside the Wall", async () => {
    mocks.getTeamAccess.mockResolvedValue(null);
    const request = new Request("https://example.com/api/tasks/task-1/reaction", { method: "POST" });

    const response = await POST(request, { params: { id: "task-1" } });

    expect(response.status).toBe(403);
  });
});
