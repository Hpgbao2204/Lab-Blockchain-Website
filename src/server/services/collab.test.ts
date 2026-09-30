import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb, type Db } from "../db/client";
import { tasks } from "../db/schema";
import { createSession, userFromToken, type SessionUser } from "../auth/sessions";
import { memoryStorage } from "../storage";
import { authenticate, createUser, ensureAdmin } from "./users";
import { createGroup, setMembers } from "./groups";
import { createTask, deleteTask, updateTask } from "./wall";
import { createLink, deleteLink, detectLinkKind, listLinks } from "./links";
import { completeUpload, deleteAttachment, listAttachments, prepareUpload, readAttachment, signedDownload, uploadAttachment, MAX_UPLOAD_BYTES } from "./attachments";
import { buildDigests, renderDigest } from "./digest";
import { monthlyReport, reportCsv } from "./reports";

let db: Db;
let admin: SessionUser, lead: SessionUser, alice: SessionUser, bob: SessionUser;
let group: string, other: string;
let aliceTask: string, leadTask: string, groupTask: string;
const storage = memoryStorage();
const pdf = new TextEncoder().encode("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n");
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

const login = async (email: string, password: string) => {
  const u = await authenticate(db, email, password);
  return (await userFromToken(db, (await createSession(db, u.id)).token))!;
};

beforeAll(async () => {
  db = await createTestDb();
  admin = await login("pi@lab.test", (await ensureAdmin(db, { email: "pi@lab.test", name: "PI" }))!);
  const mk = async (email: string, name: string) => login(email, (await createUser(db, admin, { email, name, title: null, role: "member" })).temporaryPassword);
  lead = await mk("lead@lab.test", "Lan Lead");
  alice = await mk("alice@lab.test", "Alice Nguyen");
  bob = await mk("bob@lab.test", "Bob Tran");
  group = (await createGroup(db, admin, { name: "zk-HTLC v2", description: null, paperTitle: "Paper A", targetVenue: "IEEE TDSC" })).id;
  other = (await createGroup(db, admin, { name: "Other", description: null, paperTitle: null, targetVenue: null })).id;
  await setMembers(db, admin, group, { members: [{ userId: lead.id, role: "lead" }, { userId: alice.id, role: "member" }] });
  await setMembers(db, admin, other, { members: [{ userId: bob.id, role: "member" }] });
  aliceTask = (
    await createTask(db, lead, group, {
      title: "Related work",
      dueDate: "2026-10-05",
      priority: "high",
      assigneeIds: [alice.id],
      description: null,
      venue: "IEEE S&P 2027",
      links: [{ url: "https://www.overleaf.com/project/abc123", label: "Paper draft" }],
    })
  ).id;
  leadTask = (await createTask(db, lead, group, { title: "Proofs", dueDate: "2026-10-07", priority: "normal", assigneeIds: [lead.id], description: null })).id;
  groupTask = (await createTask(db, lead, group, { title: "Read the reviews", dueDate: "2026-10-09", priority: "low", assigneeIds: [], description: null })).id;
  await createTask(db, lead, group, { title: "Next week", dueDate: "2026-10-14", priority: "low", assigneeIds: [], description: null });
}, 60_000);

describe("links", () => {
  it("detects the kind of a link from its host", () => {
    expect(detectLinkKind("https://www.overleaf.com/read/xyz")).toBe("overleaf");
    expect(detectLinkKind("https://github.com/lab/zk-htlc")).toBe("github");
    expect(detectLinkKind("https://docs.google.com/document/d/1")).toBe("drive");
    expect(detectLinkKind("https://doi.org/10.1016/j.comnet")).toBe("paper");
    expect(detectLinkKind("https://notgithub.com/x")).toBe("other");
  });

  it("stores the venue and the links given when a task is created", async () => {
    const [t] = await db.select().from(tasks).where(eq(tasks.id, aliceTask));
    expect(t.venue).toBe("IEEE S&P 2027");
    const list = await listLinks(db, alice, group);
    expect(list).toMatchObject([{ taskId: aliceTask, kind: "overleaf", label: "Paper draft" }]);
  });

  it("group links are for leads; members link their own tasks", async () => {
    await createLink(db, lead, group, { url: "https://www.overleaf.com/project/main", label: null });
    await expect(createLink(db, alice, group, { url: "https://github.com/x/y", label: null })).rejects.toMatchObject({ code: "forbidden" });
    const mine = await createLink(db, alice, group, { url: "https://github.com/lab/zk-htlc", label: "Code", taskId: aliceTask });
    expect(mine.kind).toBe("github");
    await createLink(db, alice, group, { url: "https://github.com/lab/notes", label: null, taskId: groupTask });
    await expect(createLink(db, alice, group, { url: "https://github.com/x/y", label: null, taskId: leadTask })).rejects.toMatchObject({ code: "forbidden" });
    await expect(createLink(db, bob, group, { url: "https://github.com/x/y", label: null })).rejects.toMatchObject({ code: "not_found" });
    await expect(createLink(db, bob, other, { url: "https://github.com/x/y", label: null, taskId: aliceTask })).rejects.toMatchObject({ code: "not_found" });

    const leadLink = (await listLinks(db, alice, group)).find((l) => l.taskId === null)!;
    await expect(deleteLink(db, alice, leadLink.id)).rejects.toMatchObject({ code: "forbidden" });
    await deleteLink(db, alice, mine.id);
    await deleteLink(db, lead, leadLink.id);
  });

  it("rejects non-http links", async () => {
    const { linkInput } = await import("../validation");
    expect(linkInput.safeParse({ url: "javascript:alert(1)" }).success).toBe(false);
    expect(linkInput.safeParse({ url: "https://github.com/a/b" }).success).toBe(true);
  });
});

describe("attachments", () => {
  it("accepts PDFs and images, checked by content", async () => {
    const a = await uploadAttachment(db, storage, alice, group, { name: "draft v2.pdf", bytes: pdf });
    expect(a).toMatchObject({ mime: "application/pdf", filename: "draft v2.pdf", size: pdf.byteLength });
    const img = await uploadAttachment(db, storage, alice, group, { name: "../../figure", bytes: png }, aliceTask);
    expect(img).toMatchObject({ mime: "image/png", filename: ".._.._figure.png", taskId: aliceTask });
    await expect(uploadAttachment(db, storage, alice, group, { name: "evil.pdf", bytes: new TextEncoder().encode("<script>") })).rejects.toMatchObject({ code: "invalid_input" });
    await expect(uploadAttachment(db, storage, alice, group, { name: "big.pdf", bytes: new Uint8Array(MAX_UPLOAD_BYTES + 1).fill(37) })).rejects.toMatchObject({ code: "invalid_input" });
    await expect(uploadAttachment(db, storage, alice, group, { name: "x.pdf", bytes: pdf }, leadTask)).rejects.toMatchObject({ code: "forbidden" });
  });

  it("only group members can download; only uploader or lead can delete", async () => {
    const [first] = await listAttachments(db, lead, group);
    expect((await readAttachment(db, storage, lead, first.id)).bytes.byteLength).toBeGreaterThan(0);
    await expect(readAttachment(db, storage, bob, first.id)).rejects.toMatchObject({ code: "not_found" });
    await expect(readAttachment(db, storage, null, first.id)).rejects.toMatchObject({ code: "unauthorized" });
    const leadFile = await uploadAttachment(db, storage, lead, group, { name: "plan.pdf", bytes: pdf });
    await expect(deleteAttachment(db, storage, alice, leadFile.id)).rejects.toMatchObject({ code: "forbidden" });
    await deleteAttachment(db, storage, lead, leadFile.id);
    await expect(readAttachment(db, storage, lead, leadFile.id)).rejects.toMatchObject({ code: "not_found" });
  });

  it("direct uploads: signed URL, then the real bytes are checked before the file is listed", async () => {
    // memory storage pretending to be a bucket: the "browser" writes straight into it
    const bucket = { ...memoryStorage(), signedPut: async (k: string) => `https://bucket.test/${k}?sig`, signedGet: async (k: string) => `https://bucket.test/${k}?get` };
    expect(await prepareUpload(db, storage, alice, group, { size: 10, mime: "application/pdf" })).toBeNull();
    await expect(prepareUpload(db, bucket, alice, group, { size: 10, mime: "text/html" })).rejects.toMatchObject({ code: "invalid_input" });
    await expect(prepareUpload(db, bucket, alice, group, { size: MAX_UPLOAD_BYTES + 1, mime: "application/pdf" })).rejects.toMatchObject({ code: "invalid_input" });
    await expect(prepareUpload(db, bucket, bob, group, { size: 10, mime: "application/pdf" })).rejects.toMatchObject({ code: "not_found" });
    await expect(prepareUpload(db, bucket, alice, group, { size: 10, mime: "application/pdf", taskId: leadTask })).rejects.toMatchObject({ code: "forbidden" });

    const ticket = (await prepareUpload(db, bucket, alice, group, { size: pdf.byteLength, mime: "application/pdf" }))!;
    expect(ticket.url).toContain(ticket.key);
    await expect(completeUpload(db, bucket, alice, group, { key: ticket.key, name: "early.pdf" })).rejects.toMatchObject({ code: "invalid_input" });
    await bucket.put(ticket.key, pdf);
    // someone else cannot claim alice's upload
    await expect(completeUpload(db, bucket, lead, group, { key: ticket.key, name: "mine.pdf" })).rejects.toMatchObject({ code: "invalid_input" });
    const a = await completeUpload(db, bucket, alice, group, { key: ticket.key, name: "direct.pdf" });
    expect(a).toMatchObject({ mime: "application/pdf", filename: "direct.pdf", size: pdf.byteLength, storageKey: ticket.key });
    await expect(completeUpload(db, bucket, alice, group, { key: ticket.key, name: "again.pdf" })).rejects.toBeTruthy();
    expect(await bucket.get(ticket.key)).not.toBeNull();
    expect(await signedDownload(db, bucket, lead, a.id, false)).toBe(`https://bucket.test/${ticket.key}?get`);
    await expect(signedDownload(db, bucket, bob, a.id, false)).rejects.toMatchObject({ code: "not_found" });

    // a file that lies about its type is rejected and removed from the bucket
    const fake = (await prepareUpload(db, bucket, alice, group, { size: 8, mime: "image/png" }))!;
    await bucket.put(fake.key, new TextEncoder().encode("<script>"));
    await expect(completeUpload(db, bucket, alice, group, { key: fake.key, name: "x.png" })).rejects.toMatchObject({ code: "invalid_input" });
    expect(await bucket.get(fake.key)).toBeNull();
  });

  it("deleting a task removes its files from storage", async () => {
    const t = await createTask(db, lead, group, { title: "Temp", dueDate: "2026-10-20", priority: "low", assigneeIds: [], description: null });
    const f = await uploadAttachment(db, storage, lead, group, { name: "temp.pdf", bytes: pdf }, t.id);
    expect(await storage.get(f.storageKey)).not.toBeNull();
    await deleteTask(db, lead, t.id, storage);
    expect((await listAttachments(db, lead, group)).some((a) => a.id === f.id)).toBe(false);
    expect(await storage.get(f.storageKey)).toBeNull();
  });
});

describe("monday digest", () => {
  it("lists overdue and this week's tasks for each member", async () => {
    const digests = await buildDigests(db, "2026-10-07");
    const byName = Object.fromEntries(digests.map((d) => [d.name, d]));
    expect(Object.keys(byName).sort()).toEqual(["Alice Nguyen", "Lan Lead"]);
    expect(byName["Alice Nguyen"].overdue.map((t) => t.title)).toEqual(["Related work"]);
    expect(byName["Alice Nguyen"].thisWeek.map((t) => t.title)).toEqual(["Read the reviews"]);
    expect(byName["Lan Lead"].overdue).toEqual([]);
    expect(byName["Lan Lead"].thisWeek.map((t) => t.title)).toEqual(["Proofs", "Read the reviews"]);
    const mail = renderDigest(byName["Alice Nguyen"], "https://lab.example", "2026-10-07");
    expect(mail.subject).toBe("[Blockchainist] 1 overdue, 1 due this week");
    expect(mail.text).toContain("OVERDUE\n- Mon 5 Oct · Related work (zk-HTLC v2)");
    expect(mail.html).toContain("https://lab.example/app/groups/");
    expect(renderDigest(byName["Lan Lead"], "https://lab.example", "2026-10-07").subject).toBe("[Blockchainist] 2 tasks due this week");
    expect(renderDigest({ ...byName["Alice Nguyen"], thisWeek: [] }, "https://lab.example", "2026-10-07").subject).toBe("[Blockchainist] 1 task overdue");
  });

  it("skips done tasks", async () => {
    await updateTask(db, alice, aliceTask, { status: "done" });
    const alices = (await buildDigests(db, "2026-10-07")).find((d) => d.userId === alice.id)!;
    expect(alices.overdue).toEqual([]);
    await updateTask(db, alice, aliceTask, { status: "doing" });
  });
});

describe("monthly report", () => {
  it("is admin only", async () => {
    await expect(monthlyReport(db, lead, "2026-10")).rejects.toMatchObject({ code: "forbidden" });
  });

  it("counts completed, late and overdue work per group and member", async () => {
    await updateTask(db, alice, aliceTask, { status: "done" });
    await db.update(tasks).set({ completedAt: new Date("2026-10-08T10:00:00+07:00") }).where(eq(tasks.id, aliceTask)); // 3 days late
    await updateTask(db, lead, leadTask, { status: "done" });
    await db.update(tasks).set({ completedAt: new Date("2026-10-06T10:00:00+07:00") }).where(eq(tasks.id, leadTask));
    await db.update(tasks).set({ createdAt: new Date("2026-10-01T09:00:00+07:00") });

    const r = await monthlyReport(db, admin, "2026-10", new Date("2026-10-12T12:00:00+07:00"));
    const g = r.groups.find((x) => x.id === group)!;
    expect(g).toMatchObject({ completed: 2, completedLate: 1, open: 2, overdue: 1, targetVenue: "IEEE TDSC" });
    expect(g.overdueTasks.map((t) => t.title)).toEqual(["Read the reviews"]);
    const alices = g.members.find((m) => m.userId === alice.id)!;
    expect(alices).toMatchObject({ completed: 1, completedLate: 1, open: 2, overdue: 1 });
    expect(g.members[0].role).toBe("lead");

    const earlier = await monthlyReport(db, admin, "2026-09", new Date("2026-10-12T12:00:00+07:00"));
    expect(earlier.groups.find((x) => x.id === group)?.completed ?? 0).toBe(0);
  });

  it("exports CSV with formulas neutralised", async () => {
    await setMembers(db, admin, group, { members: [{ userId: lead.id, role: "lead" }, { userId: alice.id, role: "member" }] });
    const r = await monthlyReport(db, admin, "2026-10", new Date("2026-10-12T12:00:00+07:00"));
    r.groups[0].name = "=HYPERLINK(1)";
    const csv = reportCsv(r);
    expect(csv.split("\r\n")[0]).toContain('"month","group"');
    expect(csv).toContain(`"'=HYPERLINK(1)"`);
  });
});
