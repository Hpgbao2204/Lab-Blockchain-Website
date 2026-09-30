import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/publications", () => {
  it("returns a stable empty array when Firebase Admin is not configured", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: []
    });
  });
});
