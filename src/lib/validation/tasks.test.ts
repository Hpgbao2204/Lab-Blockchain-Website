import { describe, expect, it } from "vitest";
import { parseTaskInput } from "./tasks";

describe("parseTaskInput", () => {
  it("accepts a Wall task without client-controlled assignees", () => {
    expect(
      parseTaskInput({
        teamId: "wall-1",
        title: "Prepare benchmark report",
        description: "Summarize E1 measurements.",
        targetDate: "2026-09-30",
      }),
    ).toMatchObject({
      teamId: "wall-1",
      status: "in_progress",
    });
  });

  it("rejects a client-supplied assignee list", () => {
    expect(() =>
      parseTaskInput({
        teamId: "wall-1",
        title: "Prepare benchmark report",
        assigneeMemberIds: ["member-1"],
      }),
    ).toThrow();
  });
});
