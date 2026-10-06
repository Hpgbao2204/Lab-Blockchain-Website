import { beforeAll, describe, expect, it } from "vitest";
import { createTestDb, type Db } from "../db/client";
import { createSession, userFromToken, type SessionUser } from "../auth/sessions";
import { applicationInput, applicationReplyInput, newsInput, publicationInput } from "../validation";
import type { Mail } from "../mail";
import { authenticate, createUser, ensureAdmin } from "./users";
import {
  authorStats,
  countLiveByKind,
  createNews,
  deleteNews,
  getNews,
  getPostById,
  listMyPosts,
  listNews,
  listSubmitted,
  publishedBy,
  renderReviewMail,
  renderSubmittedMail,
  reviewNews,
  slugify,
  submitNews,
  updateNews,
  withdrawNews,
} from "./news";
import { readImage, uploadImage } from "./images";
import { memoryStorage } from "../storage";
import { applicantsOf, countNewApplications, deleteApplication, listApplications, renderApplicationMail, replyToApplication, submitApplication, updateApplication } from "./applications";
import { applications } from "../db/schema";
import { zaloLink } from "@/lib/contact";
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
const item = (over: Partial<Record<string, unknown>> = {}) =>
  newsInput.parse({ kind: "news", title: "Paper accepted at SoICT 2026", summary: "Our cross-chain paper was accepted.", publishedOn: today, ...over });
const longBody = "A hashed timelock contract locks coins until a secret is revealed. ".repeat(8);

describe("news", () => {
  it("slugifies Vietnamese and punctuation", () => {
    expect(slugify("Giải thưởng Best Paper — SoICT 2026!")).toBe("giai-thuong-best-paper-soict-2026");
    expect(slugify("!!!")).toBe("news");
  });

  it("visitors need an account to write; awards, accepted papers and events are the admin's", async () => {
    await expect(createNews(db, null, item())).rejects.toMatchObject({ code: "unauthorized" });
    for (const kind of ["award", "paper", "event"]) await expect(createNews(db, member, item({ kind }))).rejects.toMatchObject({ code: "forbidden" });
  });

  it("visitors see published items up to today; drafts and future items stay hidden", async () => {
    const live = await createNews(db, admin, item());
    const twin = await createNews(db, admin, item());
    expect(twin.slug).toBe(`${live.slug}-2`);
    const draft = await createNews(db, admin, item({ title: "Draft", status: "draft" }));
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
    const shown = await getNews(db, null, live.slug);
    expect(shown.title).toBe(live.title);
    expect(shown.author).toEqual({ name: "Tran Tuan Dung", slug: null });
  });

  it("renaming moves the slug; deleting removes it", async () => {
    const n = await createNews(db, admin, item({ title: "Lab retreat", status: "draft" }));
    const same = await updateNews(db, admin, n.id, item({ title: "Lab retreat", summary: "Changed" }));
    expect(same.slug).toBe(n.slug);
    const renamed = await updateNews(db, admin, n.id, item({ title: "Lab retreat in Da Lat", kind: "event" }));
    expect(renamed.slug).toBe("lab-retreat-in-da-lat");
    await expect(updateNews(db, member, n.id, item())).rejects.toMatchObject({ code: "not_found" });
    await expect(deleteNews(db, member, n.id)).rejects.toMatchObject({ code: "not_found" });
    await deleteNews(db, admin, n.id);
    await expect(deleteNews(db, admin, n.id)).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("member posts", () => {
  let other: SessionUser;
  beforeAll(async () => {
    other = await login("binh@lab.test", (await createUser(db, admin, { email: "binh@lab.test", name: "Tran Thi Binh", title: null, role: "member" })).temporaryPassword);
  });
  const review = (over: Record<string, unknown> = {}) => item({ kind: "paper_review", title: "Review: zk-HTLC", summary: "What the paper does.", ...over });

  it("a member's post is a draft only they and admins see, whatever status they send", async () => {
    const p = await createNews(db, member, review({ status: "published", publishedOn: "2020-01-01" }));
    expect(p.status).toBe("draft");
    expect(p.publishedOn).toBe(today);
    expect(p.authorId).toBe(member.id);
    await expect(getNews(db, null, p.slug)).rejects.toMatchObject({ code: "not_found" });
    await expect(getNews(db, other, p.slug)).rejects.toMatchObject({ code: "not_found" });
    await expect(updateNews(db, other, p.id, review())).rejects.toMatchObject({ code: "not_found" });
    await expect(submitNews(db, other, p.id)).rejects.toMatchObject({ code: "not_found" });
    expect((await getNews(db, member, p.slug)).id).toBe(p.id);
    expect((await getPostById(db, admin, p.id)).id).toBe(p.id);
    expect((await listMyPosts(db, member)).map((x) => x.id)).toContain(p.id);
    expect((await listMyPosts(db, other)).map((x) => x.id)).not.toContain(p.id);
  });

  it("submitting needs a real body and, for reviews and explainers, sources", async () => {
    const p = await createNews(db, member, review({ body: "Too short." }));
    await expect(submitNews(db, member, p.id)).rejects.toMatchObject({ code: "invalid_input" });
    await updateNews(db, member, p.id, review({ body: longBody }));
    await expect(submitNews(db, member, p.id)).rejects.toMatchObject({ code: "invalid_input", message: expect.stringMatching(/sources/i) });
    await updateNews(db, member, p.id, review({ body: longBody, sources: "- The zk-HTLC paper, https://doi.org/10.1000/x" }));
    expect((await submitNews(db, member, p.id)).status).toBe("submitted");
    // an article of one's own needs no sources
    const own = await createNews(db, member, item({ kind: "article", title: "My notes", body: longBody }));
    expect((await submitNews(db, member, own.id)).status).toBe("submitted");
    await withdrawNews(db, member, own.id);
    expect((await getPostById(db, member, own.id)).status).toBe("draft");
  });

  it("the admin approves or sends back with a note; only then is it public", async () => {
    const p = await createNews(db, member, review({ title: "Review: Lotus", body: longBody, sources: "Lotus paper" }));
    await submitNews(db, member, p.id);
    expect((await listSubmitted(db, admin)).map((x) => x.id)).toContain(p.id);
    await expect(listSubmitted(db, member)).rejects.toMatchObject({ code: "forbidden" });
    await expect(reviewNews(db, member, p.id, { decision: "approve" })).rejects.toMatchObject({ code: "forbidden" });
    await expect(getNews(db, null, p.slug)).rejects.toMatchObject({ code: "not_found" });

    await expect(reviewNews(db, admin, p.id, { decision: "reject" })).rejects.toMatchObject({ code: "invalid_input" });
    const back = await reviewNews(db, admin, p.id, { decision: "reject", note: "Explain the threat model." });
    expect(back).toMatchObject({ status: "rejected", reviewNote: "Explain the threat model.", reviewedBy: admin.id });
    await expect(reviewNews(db, admin, p.id, { decision: "approve" })).rejects.toMatchObject({ code: "conflict" });

    await updateNews(db, member, p.id, review({ title: "Review: Lotus", body: longBody + " Threat model: …", sources: "Lotus paper" }));
    await submitNews(db, member, p.id);
    const ok = await reviewNews(db, admin, p.id, { decision: "approve", note: "Nice." });
    expect(ok).toMatchObject({ status: "published", publishedOn: today });
    const shown = await getNews(db, null, p.slug);
    expect(shown.author?.name).toBe("Nguyen Van An");
    expect((await listNews(db, null, { kind: "paper_review" })).map((x) => x.id)).toContain(p.id);
    expect((await countLiveByKind(db)).paper_review).toBeGreaterThanOrEqual(1);

    // a live post no longer changes without the admin
    await expect(updateNews(db, member, p.id, review())).rejects.toMatchObject({ code: "forbidden" });
    await expect(deleteNews(db, member, p.id)).rejects.toMatchObject({ code: "forbidden" });
    await expect(submitNews(db, member, p.id)).rejects.toMatchObject({ code: "conflict" });
  });

  it("authors keep their draft slug in step with the title, but not after publishing", async () => {
    const p = await createNews(db, admin, item({ title: "Old title" }));
    const kept = await updateNews(db, admin, p.id, item({ title: "New title" }));
    expect(kept.slug).toBe(p.slug);
  });

  it("the admin sees who wrote what", async () => {
    await expect(authorStats(db, member)).rejects.toMatchObject({ code: "forbidden" });
    const rows = await authorStats(db, admin);
    const an = rows.find((r) => r.id === member.id)!;
    expect(an).toMatchObject({ name: "Nguyen Van An", published: 1, submitted: 1, drafts: 2 });
    expect(an.lastPublished).toBe(today);
    expect(rows.find((r) => r.id === other.id)).toBeUndefined();
    expect((await publishedBy(db, [member.id])).map((t) => t.title)).toEqual(["Review: Lotus"]);
  });

  it("review emails go to the author, escaped", () => {
    const m = renderReviewMail({ id: "x", slug: "s", title: "<b>Hi</b>", status: "rejected", reviewNote: "Fix <script>" }, { email: "an@lab.test", name: "An" }, "PI", "https://lab.test");
    expect(m.to).toBe("an@lab.test");
    expect(m.html).not.toContain("<script>");
    expect(m.html).toContain("https://lab.test/app/posts/x");
    expect(renderSubmittedMail({ title: "T", summary: "S", kind: "incident" }, "An", { email: "pi@lab.test" }, "https://lab.test").text).toContain("/admin/posts");
  });
});

describe("post images", () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
  it("members upload images only; anyone can read them back by key", async () => {
    const storage = memoryStorage();
    await expect(uploadImage(storage, null, png)).rejects.toMatchObject({ code: "unauthorized" });
    await expect(uploadImage(storage, member, new TextEncoder().encode("%PDF-1.7"))).rejects.toMatchObject({ code: "invalid_input" });
    await expect(uploadImage(storage, member, new TextEncoder().encode("<svg onload=alert(1)>"))).rejects.toMatchObject({ code: "invalid_input" });
    const up = await uploadImage(storage, member, png);
    expect(up.url).toMatch(/^\/api\/v1\/images\/img-[0-9a-f-]{36}-png$/);
    expect((await readImage(storage, up.key)).mime).toBe("image/png");
    await expect(readImage(storage, "../secret")).rejects.toMatchObject({ code: "not_found" });
    await expect(readImage(storage, "att-123")).rejects.toMatchObject({ code: "not_found" });
  });

  it("covers must be uploaded images or https links", () => {
    expect(item({ cover: "/api/v1/images/img-abc" }).cover).toBe("/api/v1/images/img-abc");
    expect(() => item({ cover: "javascript:alert(1)" })).toThrow();
    expect(() => item({ cover: "http://x.test/a.png" })).toThrow();
  });
});

describe("applications", () => {
  const person = (n: number, over: Record<string, unknown> = {}) => ({
    name: `Lê Văn Cường ${n}`,
    studentId: `2252000${n}`,
    email: `Cuong${n}@Example.com`,
    phone: "0901 234 567",
    zalo: "0901 234 567",
    facebook: `facebook.com/cuong.${n}`,
    ...over,
  });
  const form = (over: Record<string, unknown> = {}) =>
    applicationInput.parse({
      members: [person(1)],
      program: "Undergraduate",
      interests: ["zero-knowledge", "zero-knowledge"],
      message: "I read your Lotus paper and would like to work on private cross-chain swaps.",
      ...over,
    });
  const sink = () => {
    const sent: Mail[] = [];
    return { sent, send: async (mails: Mail[]) => (sent.push(...mails), { sent: mails.length, saved: 0 }) };
  };
  const site = "https://blockchainist.id.vn";

  it("requires every field for every person, and cleans them", () => {
    const f = form();
    expect(f.members[0]).toMatchObject({ name: "Le Van Cuong 1", email: "cuong1@example.com", facebook: "https://facebook.com/cuong.1" });
    expect(() => form({ message: "hi" })).toThrow();
    expect(() => form({ program: "Kindergarten" })).toThrow();
    expect(() => form({ members: [] })).toThrow();
    for (const k of ["name", "studentId", "email", "phone", "zalo", "facebook"]) expect(() => form({ members: [person(1, { [k]: "" })] }), k).toThrow();
    expect(() => form({ members: [person(1, { facebook: "https://evil.example/facebook.com/" })] })).toThrow();
    expect(() => form({ members: [person(1, { zalo: "call me" })] })).toThrow();
    expect(() => form({ members: [person(1), person(2, { email: "CUONG1@example.com" })] })).toThrow();
    expect(() => form({ members: Array.from({ length: 7 }, (_, i) => person(i)) })).toThrow();
  });

  it("anyone can apply; only the admin reads and updates", async () => {
    const a = (await submitApplication(db, form()))!;
    expect(a).toMatchObject({ name: "Le Van Cuong 1", email: "cuong1@example.com", studentId: "22520001", status: "new" });
    expect(a.interests).toEqual(["zero-knowledge"]);

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

  it("the admin email lists the whole team, escaped, and Reply goes to the contact person", async () => {
    const a = (await submitApplication(db, form({ members: [person(1, { name: "<script>x</script>" }), person(2)] })))!;
    const mail = renderApplicationMail(a, { email: "pi@lab.test" }, site);
    expect(mail.subject).toContain("and 1 more");
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("cuong2@example.com");
    expect(mail.html).toContain("https://zalo.me/0901234567");
    expect(mail.text).toContain(`${site}/admin/applications`);
    expect(mail.replyTo).toBe("cuong1@example.com");
    expect(zaloLink("+84 901 234 567")).toBe("https://zalo.me/0901234567");
  });

  it("older single-person applications still read as one person", async () => {
    const [legacy] = await db.insert(applications).values({ name: "Old Form", email: "old@example.com", program: "PhD", message: "x".repeat(40), zalo: "0909 000 000" }).returning();
    expect(applicantsOf(legacy)).toEqual([expect.objectContaining({ name: "Old Form", email: "old@example.com", zalo: "0909 000 000" })]);
  });

  it("the admin's reply goes to everyone with Reply-To the admin, decides the status and is kept", async () => {
    const a = (await submitApplication(db, form({ members: [person(3), person(4)] })))!;
    const mail = sink();
    const reply = applicationReplyInput.parse({ status: "contacted", message: "Hẹn các bạn <b>thứ Sáu</b>!" });

    await expect(replyToApplication(db, member, a.id, reply, { send: mail.send, siteUrl: site })).rejects.toMatchObject({ code: "forbidden" });
    await expect(replyToApplication(db, null, a.id, reply, { send: mail.send, siteUrl: site })).rejects.toMatchObject({ code: "unauthorized" });
    expect(mail.sent).toHaveLength(0);

    const r = await replyToApplication(db, admin, a.id, reply, { send: mail.send, siteUrl: site });
    expect(r).toMatchObject({ emailed: true, accounts: [], loginEmails: null });
    expect(r.application.status).toBe("contacted");
    expect(mail.sent.map((m) => [m.to, m.replyTo])).toEqual([
      ["cuong3@example.com", "pi@lab.test"],
      ["cuong4@example.com", "pi@lab.test"],
    ]);
    expect(mail.sent[1].text).toContain("Chào Le Van Cuong 4,");
    expect(mail.sent[0].html).not.toContain("<b>thứ");

    const failed = await replyToApplication(db, admin, a.id, applicationReplyInput.parse({ message: "Còn đó không?" }), { send: async () => ({ sent: 0, saved: 0, error: "Resend 500" }), siteUrl: site });
    expect(failed).toMatchObject({ emailed: false, error: "Resend 500" });
    expect(failed.application.replies.map((x) => x.emailed)).toEqual([true, false]);

    await expect(replyToApplication(db, admin, "00000000-0000-0000-0000-000000000000", reply, { send: mail.send, siteUrl: site })).rejects.toMatchObject({ code: "not_found" });
    expect(() => applicationReplyInput.parse({ status: "new", message: "x" })).toThrow();
    expect(() => applicationReplyInput.parse({ message: "  " })).toThrow();
  });

  it("accepting creates an account per person, emails their login, and never twice", async () => {
    // one of them already has an account (the member created in beforeAll)
    const a = (await submitApplication(db, form({ members: [person(5, { name: "Trần Thị Mai" }), person(6, { email: "an@lab.test" }), person(7)] })))!;
    const mail = sink();
    const accept = applicationReplyInput.parse({ status: "accepted", message: "Chào mừng các bạn!", createAccounts: true });

    const r = await replyToApplication(db, admin, a.id, accept, { send: mail.send, siteUrl: site });
    expect(r.application.status).toBe("accepted");
    expect(r.accounts).toEqual([
      { email: "cuong5@example.com", name: "Tran Thi Mai", account: "created" },
      { email: "an@lab.test", name: "Le Van Cuong 6", account: "existing" },
      { email: "cuong7@example.com", name: "Le Van Cuong 7", account: "created" },
    ]);
    expect(r.loginEmails).toMatchObject({ sent: 2, of: 2 });
    const welcome = mail.sent.filter((m) => m.subject.includes("Beta"));
    expect(welcome.map((m) => m.to)).toEqual(["cuong5@example.com", "cuong7@example.com"]);

    // the new account signs in with the emailed password; username = email, name without accents
    const password = /Mật khẩu tạm: (\S+)/.exec(welcome[0].text)?.[1];
    const mai = await authenticate(db, "cuong5@example.com", password!);
    expect(mai).toMatchObject({ name: "Tran Thi Mai", role: "member" });
    expect(r.application.members.every((p) => p.userId)).toBe(true);

    const again = await replyToApplication(db, admin, a.id, accept, { send: sink().send, siteUrl: site });
    expect(again.accounts).toEqual([]);
    expect(again.loginEmails).toMatchObject({ of: 0 });

    // accepting without the box ticked makes no accounts
    const b = (await submitApplication(db, form({ members: [person(8)] })))!;
    const plain = await replyToApplication(db, admin, b.id, applicationReplyInput.parse({ status: "accepted", message: "OK" }), { send: sink().send, siteUrl: site });
    expect(plain.accounts).toEqual([]);
    await expect(authenticate(db, "cuong8@example.com", "whatever-password")).rejects.toBeTruthy();
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
