import { beforeAll, describe, expect, it } from "vitest";
import { createTestDb, type Db } from "../db/client";
import { createSession, userFromToken, type SessionUser } from "../auth/sessions";
import { profileInput } from "../validation";
import { authenticate, createUser, ensureAdmin, updateUser } from "./users";
import { getProfileForEdit, getPublishedProfile, listPublishedProfiles, profilePhoto, saveProfile, slugify } from "./profiles";
import { getPublicPerson, listPublicPeople } from "./people";

let db: Db;
let admin: SessionUser, bao: SessionUser, linh: SessionUser;

const login = async (email: string, password: string) => {
  const u = await authenticate(db, email, password);
  return (await userFromToken(db, (await createSession(db, u.id)).token))!;
};
const input = (o: Record<string, unknown>) => profileInput.parse(o);

beforeAll(async () => {
  db = await createTestDb();
  admin = await login("pi@lab.test", (await ensureAdmin(db, { email: "pi@lab.test", name: "PI" }))!);
  const mk = async (email: string, name: string) => login(email, (await createUser(db, admin, { email, name, title: "Student", role: "member" })).temporaryPassword);
  bao = await mk("bao@lab.test", "Huỳnh Phan Gia Bảo");
  linh = await mk("linh@lab.test", "Đặng Khánh Linh");
}, 60_000);

describe("profiles", () => {
  it("drafts a profile from the account, with a Vietnamese-safe address", async () => {
    expect(slugify("Đặng Khánh Linh")).toBe("dang-khanh-linh");
    const d = await getProfileForEdit(db, bao, bao.id);
    expect(d.saved).toBe(false);
    expect(d.profile).toMatchObject({ slug: "huynh-phan-gia-bao", headline: "Student", published: false });
  });

  it("members edit only their own profile; the admin can edit anyone's", async () => {
    await expect(saveProfile(db, linh, bao.id, input({ slug: "x-y-z" }))).rejects.toMatchObject({ code: "forbidden" });
    await expect(getProfileForEdit(db, null, bao.id)).rejects.toMatchObject({ code: "unauthorized" });
    await saveProfile(db, admin, linh.id, input({ slug: "dang-khanh-linh", headline: "Undergraduate researcher", published: true, cv: { education: [{ title: "B.Sc. Information Security", org: "UIT", period: "2023 – now" }] } }));
    expect((await getPublishedProfile(db, "dang-khanh-linh"))?.cv.education[0].org).toBe("UIT");
  });

  it("a portfolio profile needs its link; addresses are unique", async () => {
    await expect(saveProfile(db, bao, bao.id, input({ slug: "huynh-phan-gia-bao", display: "portfolio" }))).rejects.toMatchObject({ code: "invalid_input" });
    await expect(saveProfile(db, bao, bao.id, input({ slug: "huynh-phan-gia-bao", display: "redirect" }))).rejects.toMatchObject({ code: "invalid_input" });
    expect(() => input({ slug: "ok-slug", template: "spotlight", display: "redirect" })).not.toThrow();
    expect(() => input({ slug: "ok-slug", template: "neon" })).toThrow();
    await expect(saveProfile(db, bao, bao.id, input({ slug: "dang-khanh-linh" }))).rejects.toMatchObject({ code: "conflict" });
    const p = await saveProfile(db, bao, bao.id, input({ slug: "huynh-phan-gia-bao", display: "portfolio", portfolioUrl: "https://hpgbao2204.github.io/Hpgbao2204/", links: [{ label: "GitHub", url: "https://github.com/hpgbao2204" }] }));
    expect(p.published).toBe(false);
    expect(profilePhoto(p)).toBe("https://github.com/hpgbao2204.png?size=400");
  });

  it("rejects script links and bad addresses", () => {
    expect(() => input({ slug: "ok-slug", portfolioUrl: "javascript:alert(1)" })).toThrow();
    expect(() => input({ slug: "Bad Slug!" })).toThrow();
  });

  it("only published profiles of active accounts are public, without emails", async () => {
    expect((await listPublishedProfiles(db)).map((p) => p.slug)).toEqual(["dang-khanh-linh"]);
    expect(JSON.stringify(await listPublishedProfiles(db))).not.toContain("@lab.test");
    expect(await getPublishedProfile(db, "huynh-phan-gia-bao")).toBeNull();
    await updateUser(db, admin, linh.id, { active: false });
    expect(await listPublishedProfiles(db)).toEqual([]);
    await updateUser(db, admin, linh.id, { active: true });
  });

  it("/people shows the PI and published members; samples disappear once real profiles exist", async () => {
    const people = await listPublicPeople(db);
    expect(people[0]).toMatchObject({ slug: "tran-tuan-dung", role: "pi", hasPage: true });
    expect(people.some((p) => p.sample)).toBe(false);
    expect(people.map((p) => p.slug)).toContain("dang-khanh-linh");
    expect(await getPublicPerson(db, "huynh-phan-gia-bao")).toBeNull();
    expect((await getPublicPerson(db, "tran-tuan-dung"))?.name).toBe("Tran Tuan Dung");
  });
});
