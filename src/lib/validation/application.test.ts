import { describe, expect, it } from "vitest";
import { parseApplicationInput } from "./application";

describe("parseApplicationInput", () => {
  it("trims valid application data and defaults status metadata", () => {
    const parsed = parseApplicationInput({
      name: "  Nguyen Van A  ",
      email: "  student@example.com ",
      school: " UIT ",
      phone: " 0900000000 ",
      message: " I want to join the lab. "
    });

    expect(parsed).toEqual({
      name: "Nguyen Van A",
      email: "student@example.com",
      school: "UIT",
      phone: "0900000000",
      message: "I want to join the lab.",
      status: "pending",
      source: "website_contact_form"
    });
  });

  it("rejects invalid email and short message", () => {
    expect(() =>
      parseApplicationInput({
        name: "A",
        email: "bad-email",
        message: "x"
      })
    ).toThrow("Invalid application input");
  });
});
