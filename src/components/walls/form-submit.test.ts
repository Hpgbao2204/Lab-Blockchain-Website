import { describe, expect, it, vi } from "vitest";
import { resetFormAfter } from "./form-submit";

describe("resetFormAfter", () => {
  it("resets the captured form only after a successful async mutation", async () => {
    const reset = vi.fn();
    const form = { reset } as unknown as HTMLFormElement;

    await expect(resetFormAfter(form, async () => "saved")).resolves.toBe("saved");
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("does not reset the form when the mutation fails", async () => {
    const reset = vi.fn();
    const form = { reset } as unknown as HTMLFormElement;

    await expect(resetFormAfter(form, async () => { throw new Error("request failed"); })).rejects.toThrow("request failed");
    expect(reset).not.toHaveBeenCalled();
  });
});
