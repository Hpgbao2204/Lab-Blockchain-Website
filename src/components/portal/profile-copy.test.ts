import { describe, expect, it } from "vitest";
import { getProfileCopy } from "./profile-copy";

describe("getProfileCopy", () => {
  it("returns Vietnamese labels for the default member profile form", () => {
    const copy = getProfileCopy("vi");

    expect(copy.bio).toBe("Giới thiệu ngắn");
    expect(copy.save).toBe("Lưu hồ sơ");
    expect(copy.showPublic).toBe("Hiển thị hồ sơ công khai");
  });

  it("keeps the English profile form usable after switching locale", () => {
    const copy = getProfileCopy("en");

    expect(copy.bio).toBe("Short bio");
    expect(copy.save).toBe("Save profile");
  });
});
