import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  session: { uid: "member-uid", email: "member@example.com", role: "member" as const, status: "active" as const, memberId: "member-1" },
  getAdminDb: vi.fn(() => ({})),
  getTeamsForSession: vi.fn(),
  getWallMemberSummaries: vi.fn(),
  getTasksCollection: vi.fn(),
  getCommentsCollection: vi.fn(),
}));

vi.mock("@/lib/firebase/admin", () => ({ getAdminDb: mocks.getAdminDb }));
vi.mock("@/lib/api/auth", () => ({
  requireUser: async () => mocks.session,
  isAuthError: (value: unknown) => value instanceof Response,
  jsonError: (message: string, status: number) => Response.json({ error: message }, { status }),
}));
vi.mock("@/lib/api/teams", () => ({
  getTeamsForSession: mocks.getTeamsForSession,
  getWallMemberSummaries: mocks.getWallMemberSummaries,
}));
vi.mock("@/lib/api/tasks", () => ({
  getTasksCollection: mocks.getTasksCollection,
  serializeTask: (id: string, data: Record<string, unknown>) => ({ id, ...data }),
}));
vi.mock("@/lib/api/team-content", () => ({
  getCommentsCollection: mocks.getCommentsCollection,
  serializeComment: (id: string, data: Record<string, unknown>) => ({ id, ...data }),
}));

import { GET } from "./route";

describe("GET /api/walls/[slug]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTeamsForSession.mockResolvedValue([
      { id: "wall-1", slug: "eudr-rollup", name: "EUDR Rollup", description: "Benchmark", memberIds: ["member-1"], isActive: true },
    ]);
    mocks.getWallMemberSummaries.mockResolvedValue([
      { id: "member-1", name: "Van-Thinh Nguyen", email: "member@example.com", role: "Research member", isActive: true },
    ]);
    mocks.getTasksCollection.mockReturnValue({
      orderBy: () => ({ get: async () => ({ docs: [
        { id: "task-1", data: () => ({ teamId: "wall-1", title: "Benchmark E1", status: "in_progress" }) },
        { id: "task-2", data: () => ({ teamId: "wall-2", title: "Other wall", status: "in_progress" }) },
      ] }) }),
    });
    mocks.getCommentsCollection.mockReturnValue({
      orderBy: () => ({ get: async () => ({ docs: [
        { id: "comment-1", data: () => ({ teamId: "wall-1", targetType: "task", targetId: "task-1", body: "Working on it" }) },
        { id: "comment-2", data: () => ({ teamId: "wall-1", targetType: "progress", targetId: "progress-1", body: "Legacy" }) },
      ] }) }),
    });
  });

  it("returns one accessible Wall with its task posts and task comments", async () => {
    const response = await GET(new Request("https://example.com/api/walls/eudr-rollup"), { params: { slug: "eudr-rollup" } });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        wall: { id: "wall-1", name: "EUDR Rollup" },
        members: [{ name: "Van-Thinh Nguyen", email: "member@example.com" }],
        tasks: [{ id: "task-1", title: "Benchmark E1" }],
        comments: [{ id: "comment-1", body: "Working on it" }],
        viewer: { role: "member", memberId: "member-1" },
      },
    });
  });

  it("does not expose a Wall the viewer cannot access", async () => {
    mocks.getTeamsForSession.mockResolvedValue([]);

    const response = await GET(new Request("https://example.com/api/walls/eudr-rollup"), { params: { slug: "eudr-rollup" } });

    expect(response.status).toBe(403);
  });
});
