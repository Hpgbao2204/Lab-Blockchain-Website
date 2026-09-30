import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/auth", () => ({
  requireUser: async () => ({ uid: "member-uid", email: "member@example.com", role: "member", status: "active", memberId: "member-1" }),
  isAuthError: (value: unknown) => value instanceof Response,
  jsonError: (message: string, status: number) => Response.json({ error: message }, { status }),
}));

import { POST } from "./route";

describe("POST /api/progress", () => {
  it("retires standalone progress mutations in favor of task comments", async () => {
    const response = await POST(new Request("https://example.com/api/progress", { method: "POST" }));

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toMatchObject({ error: expect.stringContaining("task comments") });
  });
});
