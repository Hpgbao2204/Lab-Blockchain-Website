import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb, type Db } from "../db/client";
import { posts, tasks, users } from "../db/schema";
import { createSession, userFromToken, type SessionUser } from "../auth/sessions";
import { memoryStorage } from "../storage";
import { authenticate, createUser, deleteUser, ensureAdmin, listUsers } from "./users";
import { createGroup, deleteGroup, getGroup, listGroups, setMembers, updateGroup } from "./groups";
import { createPost, createTask, listTasks } from "./wall";
import { uploadAttachment } from "./attachments";
import { markWallSeen } from "./activity";

let db: Db;
let admin: SessionUser, an: SessionUser, binh: SessionUser;
const storage = memoryStorage();
const pdf = new TextEncoder().encode("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n");

const login = async (email: string, password: string) => {
  const u = await authenticate(db, email, password);
  return (await userFromToken(db, (await createSession(db, u.id)).token))!;
};

beforeAll(async () => {
  db = await createTestDb();
  admin = await login("pi@lab.test", (await ensureAdmin(db, { email: "pi@lab.test", name: "Tran Tuan Dung" }))!);
  const mk = async (email: string, name: string) => login(email, (await createUser(db, admin, { email, name, title: null, role: "member" })).temporaryPassword);
  an = await mk("an@lab.test", "Nguyen Van An");
  binh = await mk("binh@lab.test", "Le Thi Binh");
}, 60_000);

describe("editing groups", () => {
  it("renames a group and changes its members after it was created", async () => {
    const g = await createGroup(db, admin, { name: "Hai-Duy", description: null, paperTitle: null, targetVenue: null });
    await setMembers(db, admin, g.id, { members: [{ userId: an.id, role: "member" }] });
    expect((await updateGroup(db, admin, g.id, { name: "zk-HTLC audit" })).name).toBe("zk-HTLC audit");
    // add Binh as lead, remove An
    await setMembers(db, admin, g.id, { members: [{ userId: binh.id, role: "lead" }] });
    const now = await getGroup(db, admin, g.id);
    expect(now.members.map((m) => [m.name, m.role])).toEqual([["Le Thi Binh", "lead"]]);
    await expect(getGroup(db, an, g.id)).rejects.toMatchObject({ code: "not_found" });
    await expect(updateGroup(db, binh, g.id, { name: "mine" })).rejects.toMatchObject({ code: "forbidden" });
  });

  it("deletes a group with its tasks, posts and files, and only an admin can", async () => {
    const g = await createGroup(db, admin, { name: "To delete", description: null, paperTitle: null, targetVenue: null });
    await setMembers(db, admin, g.id, { members: [{ userId: an.id, role: "member" }] });
    await createTask(db, admin, g.id, { title: "Draft", dueDate: "2026-10-20", priority: "normal", assigneeIds: [], description: null });
    await createPost(db, an, g.id, { body: "Uploaded the draft", kind: "note", pinned: false });
    const file = await uploadAttachment(db, storage, an, g.id, { name: "draft.pdf", bytes: pdf });
    await markWallSeen(db, an, g.id);
    expect(await storage.get(file.storageKey)).not.toBeNull();

    await expect(deleteGroup(db, an, g.id, storage)).rejects.toMatchObject({ code: "forbidden" });
    expect(await deleteGroup(db, admin, g.id, storage)).toEqual({ files: 1 });

    expect((await listGroups(db, admin, { includeArchived: true })).map((x) => x.id)).not.toContain(g.id);
    expect(await db.select().from(tasks).where(eq(tasks.groupId, g.id))).toEqual([]);
    expect(await db.select().from(posts).where(eq(posts.groupId, g.id))).toEqual([]);
    expect(await storage.get(file.storageKey)).toBeNull();
    await expect(listTasks(db, an, g.id)).rejects.toMatchObject({ code: "not_found" });
    await expect(deleteGroup(db, admin, g.id, storage)).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("deleting accounts", () => {
  it("removes the account and its memberships; tasks it made stay", async () => {
    const temp = await login("temp@lab.test", (await createUser(db, admin, { email: "temp@lab.test", name: "Temp Student", title: null, role: "member" })).temporaryPassword);
    const g = await createGroup(db, admin, { name: "Keeps tasks", description: null, paperTitle: null, targetVenue: null });
    await setMembers(db, admin, g.id, { members: [{ userId: temp.id, role: "lead" }] });
    const t = await createTask(db, temp, g.id, { title: "Survey", dueDate: "2026-10-20", priority: "normal", assigneeIds: [temp.id], description: null });

    await expect(deleteUser(db, an, temp.id)).rejects.toMatchObject({ code: "forbidden" });
    await deleteUser(db, admin, temp.id);
    expect((await listUsers(db, admin)).map((u) => u.email)).not.toContain("temp@lab.test");
    expect((await getGroup(db, admin, g.id)).members).toEqual([]);
    const [kept] = await db.select().from(tasks).where(eq(tasks.id, t.id));
    expect(kept.createdBy).toBeNull();
    await expect(authenticate(db, "temp@lab.test", "anything")).rejects.toThrow();
  });

  it("never deletes your own account, and says when the account is gone", async () => {
    await expect(deleteUser(db, admin, admin.id)).rejects.toMatchObject({ code: "invalid_input" });
    await expect(deleteUser(db, admin, binh.id)).resolves.toBeUndefined();
    await expect(deleteUser(db, admin, binh.id)).rejects.toMatchObject({ code: "not_found" });
    const [still] = await db.select({ id: users.id }).from(users).where(eq(users.id, admin.id));
    expect(still.id).toBe(admin.id);
  });
});
