import { describe, expect, it } from "vitest";
import { serializeTask } from "./tasks";

describe("serializeTask", () => {
  it.each([
    ["not_started", "in_progress"],
    ["in_progress", "in_progress"],
    ["changes_requested", "in_progress"],
    ["blocked", "blocked"],
    ["submitted", "completed"],
    ["accepted", "completed"],
  ])("maps legacy status %s to %s", (storedStatus, status) => {
    expect(
      serializeTask("task-1", {
        teamId: "wall-1",
        title: "Prepare benchmark report",
        status: storedStatus,
      }),
    ).toMatchObject({ status });
  });

  it("returns the members who reacted to a task", () => {
    expect(
      serializeTask("task-1", {
        teamId: "wall-1",
        title: "Prepare benchmark report",
        likedByUids: ["member-a", "member-b"],
      }),
    ).toMatchObject({ likedByUids: ["member-a", "member-b"] });
  });
});
