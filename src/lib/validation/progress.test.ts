import { describe, expect, it } from "vitest";
import { parseProgressUpdateInput } from "./progress";

describe("progress image URL validation", () => {
  it("accepts HTTP(S) image URLs and rejects duplicate or unsupported URLs", () => {
    expect(
      parseProgressUpdateInput({
        title: "Draft paper",
        status: "in_progress",
        teamId: "wall-1",
        taskId: "task-1",
        imageUrls: ["https://images.example.com/draft.png"]
      })
    ).toMatchObject({ imageUrls: ["https://images.example.com/draft.png"] });
    expect(() => parseProgressUpdateInput({ title: "Draft paper", status: "in_progress", teamId: "wall-1", taskId: "task-1", imageUrls: ["https://images.example.com/draft.png", "https://images.example.com/draft.png"] })).toThrow();
    expect(() => parseProgressUpdateInput({ title: "Draft paper", status: "in_progress", teamId: "wall-1", taskId: "task-1", imageUrls: ["ftp://images.example.com/draft.png"] })).toThrow();
  });
});
