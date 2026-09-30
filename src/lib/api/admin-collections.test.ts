import { beforeEach, describe, expect, it, vi } from "vitest";

const getAdminDb = vi.fn();
const requireAdmin = vi.fn();
const getSiteSettings = vi.fn();
const deleteMarker = { __kind: "delete" };
const timestampMarker = { __kind: "timestamp" };

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: {
    delete: vi.fn(() => deleteMarker),
    serverTimestamp: vi.fn(() => timestampMarker)
  }
}));

vi.mock("@/lib/firebase/admin", () => ({ getAdminDb }));
vi.mock("@/lib/api/auth", () => ({
  requireAdmin,
  isAuthError: (value: unknown) => value instanceof Response,
  jsonError: (message: string, status: number) => Response.json({ error: message }, { status })
}));
vi.mock("@/lib/data/public-content", () => ({ getSiteSettings }));

describe("admin collection and settings clearing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdmin.mockResolvedValue({ uid: "admin-id", email: "admin.blockchainist.uit@gmail.com" });
  });

  it("deletes a cleared optional member field instead of merging the old value", async () => {
    const docSet = vi.fn().mockResolvedValue(undefined);
    getAdminDb.mockReturnValue({
      collection: (name: string) => {
        expect(name).toBe("members");
        return {
          doc: () => ({ set: docSet })
        };
      }
    });

    const { createAdminDocumentHandlers } = await import("./admin-collections");
    const { PATCH } = createAdminDocumentHandlers("members");

    const response = await PATCH(
      new Request("https://example.com/api/admin/members/member-id", {
        method: "PATCH",
        body: JSON.stringify({
          bio: "",
          __clearFields: ["bio"]
        })
      }),
      { params: { id: "member-id" } }
    );

    expect(response.status).toBe(200);
    expect(docSet).toHaveBeenCalledWith(
      expect.objectContaining({
        bio: deleteMarker,
        updatedAt: timestampMarker,
        updatedBy: "admin-id"
      }),
      { merge: true }
    );
  });

  it("rejects attempts to clear fields outside the member schema", async () => {
    const docSet = vi.fn();
    getAdminDb.mockReturnValue({
      collection: () => ({
        doc: () => ({ set: docSet })
      })
    });

    const { createAdminDocumentHandlers } = await import("./admin-collections");
    const { PATCH } = createAdminDocumentHandlers("members");
    const response = await PATCH(
      new Request("https://example.com/api/admin/members/member-id", {
        method: "PATCH",
        body: JSON.stringify({ bio: "Updated bio", __clearFields: ["createdAt"] })
      }),
      { params: { id: "member-id" } }
    );

    expect(response.status).toBe(400);
    expect(docSet).not.toHaveBeenCalled();
  });

  it("resets the PI avatar when the admin clears the field", async () => {
    const homepageGet = vi.fn().mockResolvedValue({
      exists: true,
      data: () => ({
        principalInvestigator: {
          name: "Tuan-Dung Tran",
          title: "Principal Investigator",
          bio: "Existing bio",
          avatarUrl: "https://example.com/pi.jpg",
          researchInterests: ["Blockchain"]
        }
      })
    });
    const homepageSet = vi.fn().mockResolvedValue(undefined);
    getAdminDb.mockReturnValue({
      collection: (name: string) => {
        expect(name).toBe("siteSettings");
        return {
          doc: () => ({
            get: homepageGet,
            set: homepageSet
          })
        };
      }
    });
    getSiteSettings.mockResolvedValue({
      siteName: "Blockchainist Research Group"
    });

    const { updateAdminSettings } = await import("./admin-collections");
    const response = await updateAdminSettings(
      new Request("https://example.com/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({
          siteName: "Blockchainist Research Group",
          principalInvestigator: {
            name: "Tuan-Dung Tran",
            title: "Principal Investigator",
            bio: "Existing bio",
            researchInterests: ["Blockchain"]
          },
          __clearFields: ["principalInvestigator.avatarUrl"]
        })
      })
    );

    expect(response.status).toBe(200);
    expect(homepageSet).toHaveBeenCalledWith(
      expect.objectContaining({
        principalInvestigator: expect.objectContaining({
          avatarUrl: deleteMarker
        }),
        updatedAt: timestampMarker,
        updatedBy: "admin-id"
      }),
      { merge: true }
    );
  });
});
