import { describe, expect, it } from "vitest";
import { addDays, bucketFor, formatDay, formatStamp, weekStart } from "./weeks";

describe("weeks", () => {
  it("finds the Monday of a week", () => {
    expect(weekStart("2026-09-30")).toBe("2026-09-28"); // Wednesday
    expect(weekStart("2026-10-04")).toBe("2026-09-28"); // Sunday
    expect(weekStart("2026-09-28")).toBe("2026-09-28");
  });

  it("buckets tasks by week", () => {
    const today = "2026-09-30";
    expect(bucketFor({ dueDate: "2026-09-29", status: "todo" }, today)).toBe("overdue");
    expect(bucketFor({ dueDate: "2026-10-04", status: "doing" }, today)).toBe("this-week");
    expect(bucketFor({ dueDate: "2026-10-05", status: "todo" }, today)).toBe("next-week");
    expect(bucketFor({ dueDate: "2026-10-12", status: "todo" }, today)).toBe("later");
    expect(bucketFor({ dueDate: "2026-09-01", status: "done" }, today)).toBe("done");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("formats dates the same everywhere", () => {
    expect(formatDay("2026-10-05")).toBe("Mon 5 Oct");
    expect(formatStamp("2026-09-30T19:40:00Z")).toBe("1 Oct 2026, 02:40");
  });
});
