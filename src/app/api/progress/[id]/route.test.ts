import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/auth", () => ({
  requireUser: async () => ({ uid: "member-uid", email: "member@example.com", role: "member", status: "active", memberId: "member-1" }),
  isAuthError: (value: unknown) => value instanceof Response,
  jsonError: (message: string, status: number) => Response.json({ error: message }, { status }),
}));

import { DELETE, PATCH } from "./route";

const context = { params: Promise.resolve({ id: "progress-1" }) };

describe("progress mutation retirement", () => {
  it("rejects updates and deletes", async () => {
    await expect(PATCH(new Request("https://example.com/api/progress/progress-1", { method: "PATCH" }), context)).resolves.toMatchObject({ status: 410 });
    await expect(DELETE(new Request("https://example.com/api/progress/progress-1", { method: "DELETE" }), context)).resolves.toMatchObject({ status: 410 });
  });
});
