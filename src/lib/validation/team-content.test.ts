import { describe, expect, it } from "vitest";
import { parseCommentInput, parseResourceInput } from "./team-content";

describe("team resources and comments", () => {
  it("accepts HTTPS links and rejects unsafe schemes", () => {
    expect(parseResourceInput({ teamId: "team-1", title: "Draft", url: "https://docs.google.com/document/d/example", note: "Review this" })).toMatchObject({ teamId: "team-1" });
    expect(() => parseResourceInput({ teamId: "team-1", title: "Draft", url: "javascript:alert(1)" })).toThrow();
  });

  it("requires a comment target", () => {
    expect(parseCommentInput({ teamId: "team-1", targetType: "task", targetId: "task-1", body: "Please update the evaluation." })).toMatchObject({ targetId: "task-1" });
    expect(() => parseCommentInput({ teamId: "team-1", targetType: "task", body: "Missing target" })).toThrow();
    expect(() => parseCommentInput({ teamId: "team-1", targetType: "progress", targetId: "progress-1", body: "Legacy" })).toThrow();
  });
});
