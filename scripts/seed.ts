/**
 * Creates the first admin (from ADMIN_EMAIL / ADMIN_NAME / ADMIN_PASSWORD) and, with --demo,
 * a few demo members, a group and tasks so the wall can be tried out locally.
 *
 *   npm run db:seed              # admin only
 *   npm run db:seed -- --demo    # plus demo data (local testing only)
 */
import { eq } from "drizzle-orm";
import { createDb } from "../src/server/db/client";
import { users } from "../src/server/db/schema";
import { createSession, userFromToken } from "../src/server/auth/sessions";
import { hashPassword } from "../src/server/auth/password";
import { ensureAdmin } from "../src/server/services/users";
import { createGroup, setMembers } from "../src/server/services/groups";
import { createPost, createTask, updateTask } from "../src/server/services/wall";
import { createLink } from "../src/server/services/links";
import { createAnnouncement, createMeeting } from "../src/server/services/meetings";
import { saveProfile } from "../src/server/services/profiles";
import { profileInput } from "../src/server/validation";
import { people } from "../src/data/people";
import { addDays, labToday, weekStart } from "../src/lib/weeks";

async function main() {
  const db = await createDb({ url: process.env.DATABASE_URL, dir: process.env.PGLITE_DIR ?? ".data/pglite" });
  const email = process.env.ADMIN_EMAIL || "dungtrt@uit.edu.vn";
  const created = await ensureAdmin(db, { email, name: process.env.ADMIN_NAME || "Tran Tuan Dung", password: process.env.ADMIN_PASSWORD });
  console.log(created ? `Admin created: ${email}  password: ${created}` : "An admin already exists; nothing to do.");

  if (process.argv.includes("--demo")) {
    const [adminRow] = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
    const { token } = await createSession(db, adminRow.id);
    const admin = (await userFromToken(db, token))!;
    const demoPassword = "demo-password-123";
    // Accounts for the sample profiles on /people (placeholders, not real people).
    const accounts: Record<string, typeof users.$inferSelect> = {};
    for (const p of people.filter((x) => x.sample)) {
      const mail = `${p.slug.split("-").join(".")}@blockchainist.local`;
      const [existing] = await db.select().from(users).where(eq(users.email, mail));
      accounts[p.slug] =
        existing ??
        (await db.insert(users).values({ email: mail, name: p.name, title: p.title, passwordHash: await hashPassword(demoPassword), mustChangePassword: false }).returning())[0];
    }
    const u = (slug: string) => accounts[slug];
    const today = labToday();
    const mon = weekStart(today);

    const zk = await createGroup(db, admin, {
      name: "zk-HTLC journal extension",
      paperTitle: "Unlinkable cross-chain swaps with formally verified HTLCs",
      targetVenue: "IEEE Transactions on Dependable and Secure Computing",
      submissionDeadline: addDays(mon, 45),
      description: "Extend the Computer Networks paper with a new threat model and a larger evaluation.",
    });
    await setMembers(db, admin, zk.id, {
      members: [
        { userId: u("minh-anh-le").id, role: "lead" },
        { userId: u("tuan-kiet-bui").id, role: "member" },
        { userId: u("mai-phuong-do").id, role: "member" },
        { userId: u("quoc-huy-pham").id, role: "member" },
      ],
    });
    const overleaf = "https://www.overleaf.com/project/000000000000000000000000";
    await createLink(db, admin, zk.id, { url: overleaf, label: "Paper draft (Overleaf)" });
    await createLink(db, admin, zk.id, { url: "https://github.com/Hpgbao2204/zk-htlc-demo", label: "Artifact repo" });
    await createLink(db, admin, zk.id, { url: "https://www.computer.org/csdl/journal/tq", label: "TDSC author guide" });
    const t = (g: string, title: string, due: string, assignees: string[], extra: { priority?: "low" | "normal" | "high"; venue?: string; links?: { url: string; label?: string }[] } = {}) =>
      createTask(db, admin, g, { title, dueDate: due, priority: extra.priority ?? "normal", assigneeIds: assignees, description: null, venue: extra.venue ?? null, links: (extra.links ?? []).map((l) => ({ url: l.url, label: l.label ?? null })) });
    const tdsc = "IEEE TDSC";
    await t(zk.id, "Survey 2025–2026 cross-chain privacy attacks", addDays(mon, -2), [u("tuan-kiet-bui").id], { priority: "high", venue: tdsc, links: [{ url: overleaf, label: "Related work" }] });
    const threat = await t(zk.id, "Draft threat model section", addDays(mon, 4), [u("minh-anh-le").id], { priority: "high", venue: tdsc, links: [{ url: overleaf, label: "Section 3" }] });
    await t(zk.id, "Re-run gas benchmarks on Sepolia", addDays(mon, 3), [u("quoc-huy-pham").id], { links: [{ url: "https://github.com/Hpgbao2204/zk-htlc-demo", label: "bench/" }] });
    await t(zk.id, "Weekly reading: 2 papers each", addDays(mon, 4), []);
    await t(zk.id, "Formal model in Tamarin", addDays(mon, 10), [u("mai-phuong-do").id, u("minh-anh-le").id], { venue: tdsc });
    await t(zk.id, "Figures for evaluation", addDays(mon, 18), [u("quoc-huy-pham").id], { priority: "low" });
    await updateTask(db, admin, threat.id, { status: "doing" });
    await createPost(db, admin, zk.id, { kind: "announcement", pinned: true, body: "Target: TDSC, six weeks from now. Weekly sync every Friday 4pm. Everything goes into the Overleaf project pinned above." });

    const sc = await createGroup(db, admin, {
      name: "DeFi audit benchmark",
      paperTitle: "A benchmark of real-world lending-protocol bugs",
      targetVenue: "ACM CCS 2027",
      submissionDeadline: addDays(mon, 80),
      description: "Collect, reproduce and label lending-protocol incidents; compare fuzzers and static analysers on them.",
    });
    await setMembers(db, admin, sc.id, {
      members: [
        { userId: u("gia-khang-vo").id, role: "lead" },
        { userId: u("hai-dang-ngo").id, role: "member" },
        { userId: u("khanh-linh-dang").id, role: "member" },
      ],
    });
    await createLink(db, admin, sc.id, { url: "https://www.overleaf.com/project/111111111111111111111111", label: "CCS draft" });
    const done = await t(sc.id, "Collect 2024–2026 incident reports", addDays(mon, -5), [u("hai-dang-ngo").id], { venue: "ACM CCS 2027" });
    await updateTask(db, admin, done.id, { status: "done" });
    await t(sc.id, "Reproduce the first 10 exploits in Foundry", addDays(mon, 2), [u("gia-khang-vo").id, u("hai-dang-ngo").id], { priority: "high" });
    await t(sc.id, "Label bug classes", addDays(mon, 9), [u("khanh-linh-dang").id]);
    await createPost(db, admin, sc.id, { kind: "note", pinned: false, body: "Please add your Foundry repo link to your task so everyone can re-run it." });

    // Lab meetings: this Friday's seminar (Minh Anh presents), one next week, and a past one for the rotation list.
    const meet = { location: "Room B4.10, UIT", link: "https://meet.google.com/abc-defg-hij", notes: null };
    await createMeeting(db, admin, { ...meet, title: "Weekly lab seminar", date: addDays(mon, 4), time: "14:00", presenters: [{ userId: u("minh-anh-le").id, topic: "zk-HTLC threat model" }] });
    await createMeeting(db, admin, { ...meet, title: "Weekly lab seminar", date: addDays(mon, 11), time: "14:00", presenters: [{ userId: u("gia-khang-vo").id, topic: "Reproducing DeFi exploits in Foundry" }] });
    await createMeeting(db, admin, { ...meet, title: "Weekly lab seminar", date: addDays(mon, -3), time: "14:00", presenters: [{ userId: u("hai-dang-ngo").id, topic: "Incident report survey" }] });
    await createAnnouncement(db, admin, { title: "Welcome to the lab wall", body: "Meetings, presenters and announcements now show up here and in your email." });

    // Public profiles: every sample member gets a CV page; Bao's demo account links his real portfolio.
    for (const p of people.filter((x) => x.sample)) {
      await saveProfile(db, admin, u(p.slug).id, profileInput.parse({ slug: p.slug, headline: p.title, bio: p.bio, interests: p.interests, published: true, accent: ["yellow", "blue", "teal", "violet", "orange", "pink"][p.slug.length % 6], template: p.slug.length % 2 ? "minimal" : "classic", cv: { education: [{ title: "B.Sc. Information Security", org: "University of Information Technology, VNU-HCM", period: "2023 – now" }], experience: [{ title: "Research member", org: "Blockchainist lab", period: "2025 – now", detail: p.bio }], projects: [], awards: [] } }));
    }
    const baoMail = "gia.bao.huynh@blockchainist.local";
    const [baoExisting] = await db.select().from(users).where(eq(users.email, baoMail));
    const bao = baoExisting ?? (await db.insert(users).values({ email: baoMail, name: "Huynh Phan Gia Bao", title: "Undergraduate researcher", passwordHash: await hashPassword(demoPassword), mustChangePassword: false }).returning())[0];
    await saveProfile(db, admin, bao.id, profileInput.parse({
      slug: "huynh-phan-gia-bao",
      headline: "Blockchain security researcher",
      bio: "Works on smart contract security, zero-knowledge proofs, cross-chain protocols and decentralized identity.",
      interests: ["Smart contracts", "Zero-knowledge", "Cross-chain", "Identity & reputation"],
      display: "portfolio",
      portfolioUrl: "https://hpgbao2204.github.io/Hpgbao2204/",
      links: [{ label: "GitHub", url: "https://github.com/hpgbao2204" }, { label: "Google Scholar", url: "https://scholar.google.com/citations?user=koh0HscAAAAJ" }, { label: "ORCID", url: "https://orcid.org/0009-0008-8773-0482" }],
      accent: "blue",
      published: true,
    }));

    console.log(`Demo data added for ${Object.keys(accounts).length} sample members (e.g. minh.anh.le@blockchainist.local). Password: ${demoPassword}`);
  }
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
