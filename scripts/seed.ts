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
import { createPost, createTask } from "../src/server/services/wall";
import { addDays, labToday, weekStart } from "../src/lib/weeks";

async function main() {
  const db = await createDb({ url: process.env.DATABASE_URL, dir: process.env.PGLITE_DIR ?? ".data/pglite" });
  const email = process.env.ADMIN_EMAIL || "admin@blockchainist.local";
  const created = await ensureAdmin(db, { email, name: process.env.ADMIN_NAME || "Tran Tuan Dung", password: process.env.ADMIN_PASSWORD });
  console.log(created ? `Admin created: ${email}  password: ${created}` : "An admin already exists; nothing to do.");

  if (process.argv.includes("--demo")) {
    const [adminRow] = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
    const { token } = await createSession(db, adminRow.id);
    const admin = (await userFromToken(db, token))!;
    const demoPassword = "demo-password-123";
    const mk = async (email: string, name: string, title: string) => {
      const [existing] = await db.select().from(users).where(eq(users.email, email));
      if (existing) return existing;
      const [u] = await db.insert(users).values({ email, name, title, passwordHash: await hashPassword(demoPassword), mustChangePassword: false }).returning();
      return u;
    };
    const lead = await mk("lead@blockchainist.local", "Huynh Phan Gia Bao", "Research assistant");
    const a = await mk("an@blockchainist.local", "Nguyen Van An", "Undergraduate researcher");
    const b = await mk("binh@blockchainist.local", "Tran Thi Binh", "Undergraduate researcher");
    const today = labToday();
    const mon = weekStart(today);
    const g = await createGroup(db, admin, {
      name: "zk-HTLC journal extension",
      paperTitle: "Unlinkable cross-chain swaps with formally verified HTLCs",
      targetVenue: "IEEE Transactions on Dependable and Secure Computing",
      submissionDeadline: addDays(mon, 45),
      description: "Extend the Computer Networks paper with a new threat model and a larger evaluation.",
    });
    await setMembers(db, admin, g.id, { members: [{ userId: lead.id, role: "lead" }, { userId: a.id, role: "member" }, { userId: b.id, role: "member" }] });
    const t = (title: string, due: string, assignees: string[], priority: "low" | "normal" | "high" = "normal") =>
      createTask(db, admin, g.id, { title, dueDate: due, priority, assigneeIds: assignees, description: null });
    await t("Survey 2025–2026 cross-chain privacy attacks", addDays(mon, -2), [a.id], "high");
    await t("Draft threat model section", addDays(mon, 4), [lead.id], "high");
    await t("Re-run gas benchmarks on Sepolia", addDays(mon, 3), [b.id]);
    await t("Weekly reading: 2 papers each", addDays(mon, 4), []);
    await t("Formal model in Tamarin", addDays(mon, 10), [lead.id, a.id]);
    await t("Figures for evaluation", addDays(mon, 18), [b.id], "low");
    await createPost(db, admin, g.id, { kind: "announcement", pinned: true, body: "Target: submit six weeks from now. Weekly sync every Friday 4pm." });
    console.log(`Demo data added. Demo members sign in with password: ${demoPassword}`);
  }
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
