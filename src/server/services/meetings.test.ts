import { beforeAll, describe, expect, it } from "vitest";
import { createTestDb, type Db } from "../db/client";
import { createSession, userFromToken, type SessionUser } from "../auth/sessions";
import { authenticate, createUser, ensureAdmin, updateUser } from "./users";
import {
  createAnnouncement,
  createMeeting,
  deleteMeeting,
  listAnnouncements,
  listMeetings,
  markReminded,
  meetingParts,
  meetingStart,
  meetingsDueForReminder,
  presenterRotation,
  recipients,
  renderAnnouncementMail,
  renderMeetingMail,
  updateMeeting,
} from "./meetings";
import { addDays, labToday } from "@/lib/weeks";

let db: Db;
let admin: SessionUser, an: SessionUser, binh: SessionUser, chi: SessionUser;

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
  chi = await mk("chi@lab.test", "Pham Minh Chi");
}, 60_000);

const today = labToday();
const base = { location: "Room B4.10", link: null, notes: null };

describe("meetings", () => {
  it("only the admin schedules meetings; presenters must be active accounts", async () => {
    const input = { ...base, title: "Weekly seminar", date: addDays(today, 3), time: "14:00", presenters: [{ userId: an.id, topic: "zk-HTLC" }] };
    await expect(createMeeting(db, an, input)).rejects.toMatchObject({ code: "forbidden" });
    await updateUser(db, admin, chi.id, { active: false });
    await expect(createMeeting(db, admin, { ...input, presenters: [{ userId: chi.id, topic: null }] })).rejects.toMatchObject({ code: "invalid_input" });
    await updateUser(db, admin, chi.id, { active: true });
    const m = await createMeeting(db, admin, input);
    expect(m.presenters).toEqual([{ id: an.id, name: "Nguyen Van An", email: "an@lab.test", topic: "zk-HTLC" }]);
    expect(meetingParts(m.startsAt)).toEqual({ date: addDays(today, 3), time: "14:00" });
  });

  it("every member sees upcoming meetings; visitors do not", async () => {
    expect((await listMeetings(db, binh, { when: "upcoming" })).map((m) => m.title)).toEqual(["Weekly seminar"]);
    await expect(listMeetings(db, null, { when: "upcoming" })).rejects.toMatchObject({ code: "unauthorized" });
  });

  it("swapping the presenter replaces the list", async () => {
    const [m] = await listMeetings(db, admin, { when: "upcoming" });
    const updated = await updateMeeting(db, admin, m.id, { ...base, title: m.title, date: addDays(today, 3), time: "15:30", presenters: [{ userId: binh.id, topic: null }] });
    expect(updated.presenters.map((p) => p.id)).toEqual([binh.id]);
    expect(meetingParts(updated.startsAt).time).toBe("15:30");
  });

  it("rotation lists people who presented longest ago first", async () => {
    await createMeeting(db, admin, { ...base, title: "Past", date: addDays(today, -14), time: "14:00", presenters: [{ userId: an.id, topic: null }] });
    await createMeeting(db, admin, { ...base, title: "Older", date: addDays(today, -28), time: "14:00", presenters: [{ userId: chi.id, topic: null }] });
    const order = (await presenterRotation(db, admin)).map((p) => p.name);
    // never presented (alphabetical), then Chi (4 weeks ago), then An (2 weeks ago); Binh's slot is still upcoming
    expect(order).toEqual(["Le Thi Binh", "Tran Tuan Dung", "Pham Minh Chi", "Nguyen Van An"]);
    await expect(presenterRotation(db, an)).rejects.toMatchObject({ code: "forbidden" });
  });

  it("the day-of reminder picks today's meetings once", async () => {
    const m = await createMeeting(db, admin, { ...base, title: "Today", date: today, time: "23:30", presenters: [] });
    expect((await meetingsDueForReminder(db, today)).map((x) => x.id)).toEqual([m.id]);
    await markReminded(db, m.id);
    expect(await meetingsDueForReminder(db, today)).toEqual([]);
    await deleteMeeting(db, admin, m.id);
  });

  it("emails go to every active account and tell presenters it is their turn", async () => {
    const people = await recipients(db);
    expect(people.map((p) => p.email).sort()).toEqual(["an@lab.test", "binh@lab.test", "chi@lab.test", "pi@lab.test"]);
    const [m] = await listMeetings(db, admin, { when: "upcoming" });
    const toBinh = renderMeetingMail(m, people.find((p) => p.id === binh.id)!, "https://lab.test", "new");
    const toAn = renderMeetingMail(m, people.find((p) => p.id === an.id)!, "https://lab.test", "new");
    expect(toBinh.subject).toContain("you are presenting");
    expect(toBinh.html).toContain("You are presenting");
    expect(toAn.subject).not.toContain("you are presenting");
    expect(toAn.text).toContain("Presenting: Le Thi Binh");
    expect(toAn.text).toContain("Where: Room B4.10");
    expect(meetingStart("2026-10-05", "14:00").toISOString()).toBe("2026-10-05T07:00:00.000Z");
  });
});

describe("announcements", () => {
  it("only the admin posts; every member reads; html is escaped", async () => {
    await expect(createAnnouncement(db, an, { title: "x", body: "y" })).rejects.toMatchObject({ code: "forbidden" });
    const a = await createAnnouncement(db, admin, { title: "No meeting next week", body: "Conference travel. <b>See you after.</b>" });
    expect((await listAnnouncements(db, chi)).map((x) => x.id)).toEqual([a.id]);
    await expect(listAnnouncements(db, null)).rejects.toMatchObject({ code: "unauthorized" });
    const mail = renderAnnouncementMail({ ...a, author: "Tran Tuan Dung" }, { email: "an@lab.test", name: "Nguyen Van An" }, "https://lab.test");
    expect(mail.html).not.toContain("<b>See");
    expect(mail.text).toContain("Hi An,");
  });
});
