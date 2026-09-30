import { describe, expect, it } from "vitest";
import { getSafeAdminRedirect } from "./admin-redirect";

describe("getSafeAdminRedirect", () => {
  it("accepts only local admin routes", () => {
    expect(getSafeAdminRedirect("/admin?view=accounts")).toBe("/admin?view=accounts");
    expect(getSafeAdminRedirect("https://example.com")).toBe("/admin");
    expect(getSafeAdminRedirect("javascript:alert(1)")).toBe("/admin");
    expect(getSafeAdminRedirect("//example.com")).toBe("/admin");
  });
});
