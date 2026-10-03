import { beforeAll, describe, expect, it } from "vitest";
import { createTestDb, type Db } from "../db/client";
import { createSession, userFromToken, type SessionUser } from "../auth/sessions";
import { applicationInput, newsInput, publicationInput } from "../validation";
import { authenticate, createUser, ensureAdmin } from "./users";
import { createNews, deleteNews, getNews, listNews, slugify, updateNews } from "./news";
import { countNewApplications, deleteApplication, listApplications, renderApplicationMail, submitApplication, updateApplication } from "./applications";
import { addPublication, allPublications, deletePublication, listAdminPublications, setPublicationHidden, updatePublication } from "./publications";
import { publications as snapshot } from "@/data/publications";
import { listPublications, publicationUrl } from "@/lib/content";
import { addDays, labToday } from "@/lib/weeks";

let db: Db;
let admin: SessionUser, member: SessionUser;

const login = async (email: string, password: string) => {
  const u = await authenticate(db, email, password);
  return (await userFromToken(db, (await createSession(db, u.id)).token))!;
};

beforeAll(async () => {
  db = await createTestDb();
  admin = await login("pi@lab.test", (await ensureAdmin(db, { email: "pi@lab.test", name: "Tran Tuan Dung" }))!);
  member = await login("an@lab.test", (await createUser(db, admin, { email: "an@lab.test", name: "Nguyen Van An", title: null, role: "member" })).temporaryPassword);
}, 60_000);

const today = labToday();
const item = (over: Partial<ReturnType<typeof newsInput.parse>> = {}) =>
  newsInput.parse({ title: "Paper accepted at SoICT 2026", summary: "Our cross-chain paper was accepted.", publishedOn: today, ...over });

describe("news", () => {
  it("slugifies Vietnamese and punctuation", () => {
    expect(slugify("Giải thưởng Best Paper — SoICT 2026!")).toBe("giai-thuong-best-paper-soict-2026");
    expect(slugify("!!!")).toBe("news");
  });

  it("only the admin writes news", async () => {
    await expect(createNews(db, member, item())).rejects.toMatchObject({ code: "forbidden" });
    await expect(createNews(db, null, item())).rejects.toMatchObject({ code: "unauthorized" });
  });

  it("visitors see published items up to today; drafts and future items stay hidden", async () => {
    const live = await createNews(db, admin, item());
    const twin = await createNews(db, admin, item());
    expect(twin.slug).toBe(`${live.slug}-2`);
    const draft = await createNews(db, admin, item({ title: "Draft", published: false }));
    const later = await createNews(db, admin, item({ title: "Next month", publishedOn: addDays(today, 30) }));

    const visible = (await listNews(db, null)).map((n) => n.id);
    expect(visible).toContain(live.id);
    expect(visible).not.toContain(draft.id);
    expect(visible).not.toContain(later.id);
    expect((await listNews(db, member, { all: true })).map((n) => n.id)).not.toContain(draft.id);
    expect((await listNews(db, admin, { all: true })).map((n) => n.id)).toEqual(expect.arrayContaining([draft.id, later.id]));

    await expect(getNews(db, null, draft.slug)).rejects.toMatchObject({ code: "not_found" });
    await expect(getNews(db, member, later.slug)).rejects.toMatchObject({ code: "not_found" });
    expect((await getNews(db, admin, draft.slug)).id).toBe(draft.id);
    expect((await getNews(db, null, live.slug)).title).toBe(live.title);
  });

  it("renaming moves the slug; deleting removes it", async () => {
    const n = await createNews(db, admin, item({ title: "Lab retreat" }));
    const same = await updateNews(db, admin, n.id, item({ title: "Lab retreat", summary: "Changed" }));
    expect(same.slug).toBe(n.slug);
    const renamed = await updateNews(db, admin, n.id, item({ title: "Lab retreat in Da Lat", kind: "event" }));
    expect(renamed.slug).toBe("lab-retreat-in-da-lat");
    await expect(updateNews(db, member, n.id, item())).rejects.toMatchObject({ code: "forbidden" });
    await deleteNews(db, admin, n.id);
    await expect(deleteNews(db, admin, n.id)).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("applications", () => {
  const form = (over: Record<string, unknown> = {}) =>
    applicationInput.parse({
      name: "Le Van Cuong",
      email: "Cuong@Example.com",
      program: "Undergraduate",
      interests: ["zero-knowledge", "zero-knowledge"],
      message: "I read your Lotus paper and would like to work on private cross-chain swaps.",
      ...over,
    });

  it("rejects short messages and unknown programs", () => {
    expect(() => form({ message: "hi" })).toThrow();
    expect(() => form({ program: "Kindergarten" })).toThrow();
  });

  it("anyone can apply; only the admin reads and updates", async () => {
    const a = (await submitApplication(db, form()))!;
    expect(a.email).toBe("cuong@example.com");
    expect(a.interests).toEqual(["zero-knowledge"]);
    expect(a.status).toBe("new");

    await expect(listApplications(db, member)).rejects.toMatchObject({ code: "forbidden" });
    await expect(listApplications(db, null)).rejects.toMatchObject({ code: "unauthorized" });
    await expect(updateApplication(db, member, a.id, { status: "accepted", adminNote: undefined })).rejects.toMatchObject({ code: "forbidden" });
    await expect(deleteApplication(db, member, a.id)).rejects.toMatchObject({ code: "forbidden" });

    expect(await countNewApplications(db, admin)).toBe(1);
    const done = await updateApplication(db, admin, a.id, { status: "contacted", adminNote: "Interview Friday" });
    expect(done).toMatchObject({ status: "contacted", adminNote: "Interview Friday" });
    expect(await countNewApplications(db, admin)).toBe(0);
    expect((await listApplications(db, admin)).map((x) => x.id)).toContain(a.id);
  });

  it("drops honeypot submissions without storing them", async () => {
    const before = (await listApplications(db, admin)).length;
    expect(await submitApplication(db, form({ website: "http://spam.example" }))).toBeNull();
    expect((await listApplications(db, admin)).length).toBe(before);
  });

  it("escapes the applicant's text in the admin email", async () => {
    const a = (await submitApplication(db, form({ name: "<script>x</script>" })))!;
    const mail = renderApplicationMail(a, { email: "pi@lab.test" }, "https://blockchainist.id.vn");
    expect(mail.html).not.toContain("<script>");
    expect(mail.text).toContain("https://blockchainist.id.vn/admin/applications");
  });
});

describe("publications", () => {
  const paper = (over: Record<string, unknown> = {}) =>
    publicationInput.parse({
      title: "A zero-knowledge bridge for private cross-chain transfers",
      year: 2026,
      kind: "conference",
      authors: ["A Nguyen", "TD Tran"],
      venue: "SoICT 2026",
      url: "https://example.org/paper.pdf",
      ...over,
    });

  it("only the admin adds, edits, hides and deletes", async () => {
    await expect(addPublication(db, member, paper())).rejects.toMatchObject({ code: "forbidden" });
    await expect(listAdminPublications(db, member)).rejects.toMatchObject({ code: "forbidden" });
    await expect(setPublicationHidden(db, null, snapshot[0].id, true)).rejects.toMatchObject({ code: "unauthorized" });
  });

  it("additions appear on the public list with tagged areas and their link", async () => {
    const p = await addPublication(db, admin, paper());
    expect(p.areas).toEqual(expect.arrayContaining(["cross-chain", "zero-knowledge"]));
    const all = await allPublications(db);
    expect(all).toHaveLength(snapshot.length + 1);
    expect(listPublications({ q: "zero-knowledge bridge" }, all).map((x) => x.id)).toEqual([p.id]);
    expect(publicationUrl(p)).toBe("https://example.org/paper.pdf");

    const edited = await updatePublication(db, admin, p.id, paper({ title: "Renamed", areas: ["identity", "not-an-area"] }));
    expect(edited.areas).toEqual(["identity"]);
    await deletePublication(db, admin, p.id);
    expect(await allPublications(db)).toHaveLength(snapshot.length);
  });

  it("snapshot papers can be hidden and shown again, not edited or deleted", async () => {
    const id = snapshot[0].id;
    await setPublicationHidden(db, admin, id, true);
    expect((await allPublications(db)).map((p) => p.id)).not.toContain(id);
    expect((await listAdminPublications(db, admin)).find((p) => p.id === id)).toMatchObject({ hidden: true, source: "snapshot" });
    await setPublicationHidden(db, admin, id, false);
    expect((await allPublications(db)).map((p) => p.id)).toContain(id);

    await expect(updatePublication(db, admin, id, paper())).rejects.toMatchObject({ code: "forbidden" });
    await expect(deletePublication(db, admin, id)).rejects.toMatchObject({ code: "not_found" });
    await expect(setPublicationHidden(db, admin, "no-such-paper", true)).rejects.toMatchObject({ code: "not_found" });
  });

  it("refuses a DOI that is already listed", async () => {
    const withDoi = snapshot.find((p) => p.doi)!;
    await expect(addPublication(db, admin, paper({ doi: `https://doi.org/${withDoi.doi}` }))).rejects.toMatchObject({ code: "conflict" });
  });
});
