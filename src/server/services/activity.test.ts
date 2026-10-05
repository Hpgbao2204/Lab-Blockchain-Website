import { beforeAll, describe, expect, it } from "vitest";
import { createTestDb, type Db } from "../db/client";
import { createSession, userFromToken, type SessionUser } from "../auth/sessions";
import { AppError } from "../errors";
import { authenticate, createUser, ensureAdmin } from "./users";
import { createGroup, setMembers } from "./groups";
import { addTaskComment, createPost, createTask, updateTask } from "./wall";
import { createAnnouncement } from "./meetings";
import { markWallSeen, wallActivity } from "./activity";

let db: Db;
let admin: SessionUser, an: SessionUser, binh: SessionUser, outsider: SessionUser;
let group: string, other: string, task: string;

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
  outsider = await mk("out@lab.test", "Tran Van Out");
  group = (await createGroup(db, admin, { name: "zk-rollup audit", description: null, paperTitle: null, targetVenue: null })).id;
  other = (await createGroup(db, admin, { name: "Other group", description: null, paperTitle: null, targetVenue: null })).id;
  await setMembers(db, admin, group, { members: [{ userId: an.id, role: "lead" }, { userId: binh.id, role: "member" }] });
  await setMembers(db, admin, other, { members: [{ userId: outsider.id, role: "member" }] });
  task = (await createTask(db, admin, group, { title: "Write the threat model", dueDate: "2026-10-09", priority: "normal", assigneeIds: [an.id], description: null })).id;
}, 60_000);

describe("wall activity (the red dot on My wall)", () => {
  it("counts what other people did, never your own work", async () => {
    const mine = await wallActivity(db, an);
    expect(mine.groups[group]).toBe(1); // the task the PI created
    await createPost(db, an, group, { body: "Draft is up", kind: "note", pinned: false });
    expect((await wallActivity(db, an)).groups[group]).toBe(1); // still only the PI's task
    expect((await wallActivity(db, binh)).groups[group]).toBe(2); // the task and An's note
  });

  it("shows nothing from groups you are not in", async () => {
    expect((await wallActivity(db, outsider)).groups[group]).toBeUndefined();
    expect((await wallActivity(db, an)).groups[other]).toBeUndefined();
  });

  it("clears a group once you open its wall, and counts what happens afterwards", async () => {
    await markWallSeen(db, an, group);
    expect((await wallActivity(db, an)).groups[group]).toBeUndefined();
    await addTaskComment(db, admin, task, { body: "Please add the assumptions." });
    await updateTask(db, admin, task, { priority: "high" });
    const after = await wallActivity(db, an);
    expect(after.groups[group]).toBe(2); // the PI's comment and the change to the task
    expect(after.total).toBe(after.lab + 2);
  });

  it("counts lab announcements and clears them with the dashboard", async () => {
    await createAnnouncement(db, admin, { title: "Lab seminar moved", body: "Now on Friday." });
    expect((await wallActivity(db, binh)).lab).toBe(1);
    expect((await wallActivity(db, admin)).lab).toBe(0); // the PI wrote it
    await markWallSeen(db, binh, "lab");
    expect((await wallActivity(db, binh)).lab).toBe(0);
  });

  it("refuses visitors and walls you cannot see", async () => {
    await expect(wallActivity(db, null)).rejects.toThrow(AppError);
    await expect(markWallSeen(db, outsider, group)).rejects.toThrow(AppError);
  });
});
