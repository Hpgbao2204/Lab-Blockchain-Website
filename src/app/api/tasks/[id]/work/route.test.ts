import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  session: {
    uid: "member-uid",
    email: "member@example.com",
    role: "member" as const,
    status: "active" as const,
    memberId: "member-1",
  },
}));

vi.mock("@/lib/api/auth", () => ({
  requireUser: async () => mocks.session,
  isAuthError: (value: unknown) => value instanceof Response,
  jsonError: (message: string, status: number) =>
    Response.json({ error: message }, { status }),
}));
import { POST } from "./route";

function request(action: string) {
  return new Request("https://example.com/api/tasks/task-1/work", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
}

describe("POST /api/tasks/[id]/work", () => {
  it("retires member-driven status changes", async () => {
    const response = await POST(request("start"), { params: { id: "task-1" } });

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toEqual({
      error: "Task status is managed by the wall owner",
    });
  });
});
