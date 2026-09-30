import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("POST /api/admin/tasks/[id]/review", () => {
  it("retires the submitted-review workflow", async () => {
    const response = await POST(
      new Request("https://example.com/api/admin/tasks/task-1/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      }),
      { params: { id: "task-1" } },
    );

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toEqual({
      error: "Task review has been replaced by owner-managed statuses",
    });
  });
});
