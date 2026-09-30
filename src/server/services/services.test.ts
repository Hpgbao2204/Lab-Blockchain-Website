import { beforeAll, describe, expect, it } from "vitest";
import { createTestDb, type Db } from "../db/client";
import { createSession, userFromToken, type SessionUser } from "../auth/sessions";
import { authenticate, changePassword, createUser, ensureAdmin, resetPassword, updateUser } from "./users";
import { createGroup, getGroup, listGroups, setMembers } from "./groups";
import { addTaskComment, createPost, createTask, listTasks, myOpenTasks, updateTask } from "./wall";

let db: Db;
let admin: SessionUser;
let lead: SessionUser;
let alice: SessionUser;
let bob: SessionUser;
let groupA: string;
let groupB: string;

const asSession = async (email: string, password: string) => {
  const u = await authenticate(db, email, password);
  const { token } = await createSession(db, u.id);
  return (await userFromToken(db, token))!;
};

beforeAll(async () => {
  db = await createTestDb();
  const pw = await ensureAdmin(db, { email: "pi@lab.test", name: "PI" });
  admin = await asSession("pi@lab.test", pw!);
  const mk = async (email: string, name: string) => {
    const { temporaryPassword } = await createUser(db, admin, { email, name, title: null, role: "member" });
    return asSession(email, temporaryPassword);
  };
  lead = await mk("lead@lab.test", "Lead");
  alice = await mk("alice@lab.test", "Alice");
  bob = await mk("bob@lab.test", "Bob");
  groupA = (await createGroup(db, admin, { name: "zk-HTLC v2", paperTitle: "Paper A", description: null, targetVenue: null })).id;
  groupB = (await createGroup(db, admin, { name: "Other paper", description: null, paperTitle: null, targetVenue: null })).id;
  await setMembers(db, admin, groupA, { members: [{ userId: lead.id, role: "lead" }, { userId: alice.id, role: "member" }] });
  await setMembers(db, admin, groupB, { members: [{ userId: bob.id, role: "member" }] });
}, 60_000);

describe("accounts", () => {
  it("only the admin can create accounts", async () => {
    await expect(createUser(db, alice, { email: "x@lab.test", name: "X", title: null, role: "member" })).rejects.toMatchObject({ code: "forbidden" });
    await expect(createUser(db, null, { email: "x@lab.test", name: "X", title: null, role: "member" })).rejects.toMatchObject({ code: "unauthorized" });
  });

  it("new accounts must change their temporary password", async () => {
    expect(alice.mustChangePassword).toBe(true);
    const { temporaryPassword, user } = await resetPassword(db, admin, bob.id);
    const s = await asSession("bob@lab.test", temporaryPassword);
    await changePassword(db, s, { currentPassword: temporaryPassword, newPassword: "a-much-better-pass" });
    const again = await asSession("bob@lab.test", "a-much-better-pass");
    expect(again.mustChangePassword).toBe(false);
    expect(user.id).toBe(bob.id);
    bob = again;
  });

  it("rejects wrong passwords and deactivated users", async () => {
    await expect(authenticate(db, "bob@lab.test", "nope")).rejects.toMatchObject({ code: "unauthorized" });
    await updateUser(db, admin, bob.id, { active: false });
    await expect(authenticate(db, "bob@lab.test", "a-much-better-pass")).rejects.toMatchObject({ code: "unauthorized" });
    await updateUser(db, admin, bob.id, { active: true });
    await expect(updateUser(db, admin, admin.id, { active: false })).rejects.toMatchObject({ code: "invalid_input" });
  });
});

describe("walls", () => {
  it("members only see their own groups; admin sees all", async () => {
    expect((await listGroups(db, alice)).map((g) => g.id)).toEqual([groupA]);
    expect((await listGroups(db, admin)).length).toBe(2);
    await expect(getGroup(db, bob, groupA)).rejects.toMatchObject({ code: "not_found" });
    await expect(listTasks(db, bob, groupA)).rejects.toMatchObject({ code: "not_found" });
  });

  it("leads assign tasks; members only move status of their own tasks", async () => {
    await expect(createTask(db, alice, groupA, { title: "t", dueDate: "2026-10-05", priority: "normal", assigneeIds: [], description: null })).rejects.toMatchObject({ code: "forbidden" });
    await expect(createTask(db, lead, groupA, { title: "t", dueDate: "2026-10-05", priority: "normal", assigneeIds: [bob.id], description: null })).rejects.toMatchObject({ code: "invalid_input" });

    const mine = await createTask(db, lead, groupA, { title: "Related work", dueDate: "2026-10-05", priority: "high", assigneeIds: [alice.id], description: null });
    const leads = await createTask(db, lead, groupA, { title: "Proofs", dueDate: "2026-10-07", priority: "normal", assigneeIds: [lead.id], description: null });
    const all = await createTask(db, lead, groupA, { title: "Read the reviews", dueDate: "2026-10-09", priority: "low", assigneeIds: [], description: null });

    expect((await updateTask(db, alice, mine.id, { status: "doing" })).status).toBe("doing");
    expect((await updateTask(db, alice, all.id, { status: "done" })).status).toBe("done");
    await expect(updateTask(db, alice, leads.id, { status: "done" })).rejects.toMatchObject({ code: "forbidden" });
    await expect(updateTask(db, alice, mine.id, { title: "renamed" })).rejects.toMatchObject({ code: "forbidden" });
    await expect(updateTask(db, bob, mine.id, { status: "done" })).rejects.toMatchObject({ code: "not_found" });

    const list = await listTasks(db, alice, groupA);
    expect(list.find((t) => t.id === mine.id)?.assignees.map((a) => a.name)).toEqual(["Alice"]);
    const open = await myOpenTasks(db, alice);
    expect(open.map((t) => t.title)).toEqual(["Related work"]);
  });

  it("comments and announcements respect roles", async () => {
    const [t] = await listTasks(db, alice, groupA);
    await addTaskComment(db, alice, t.id, { body: "Draft is in the doc." });
    await expect(addTaskComment(db, bob, t.id, { body: "hi" })).rejects.toMatchObject({ code: "not_found" });
    await expect(createPost(db, alice, groupA, { body: "x", kind: "announcement", pinned: false })).rejects.toMatchObject({ code: "forbidden" });
    expect((await createPost(db, alice, groupA, { body: "Uploaded figures", kind: "note", pinned: false })).kind).toBe("note");
    expect((await createPost(db, lead, groupA, { body: "Deadline moved", kind: "announcement", pinned: true })).pinned).toBe(true);
  });
});

describe("parsed API input", () => {
  it("lets a member move status with a body parsed like the API does", async () => {
    const { taskPatch } = await import("../validation");
    const [t] = (await listTasks(db, alice, groupA)).filter((x) => x.assignees.some((a) => a.id === alice.id));
    const updated = await updateTask(db, alice, t.id, taskPatch.parse({ status: "review" }));
    expect(updated.status).toBe("review");
  });
});
