import Link from "next/link";
import { AdminGroups } from "@/components/app/admin-groups";
import { AdminUsers } from "@/components/app/admin-users";
import { PageHead, SectionHead } from "@/components/site/page-head";
import { getDb } from "@/server/db";
import { requirePageUser } from "@/server/auth/current";
import { listGroups, listMembers } from "@/server/services/groups";
import { listUsers } from "@/server/services/users";
import { countNewApplications } from "@/server/services/applications";

/** `?name=…&email=…` prefills the new-account form (the "Create their account" link on an accepted application). */
export default async function AdminPage({ searchParams }: { searchParams: Promise<{ name?: string; email?: string }> }) {
  const { name, email } = await searchParams;
  const user = await requirePageUser({ admin: true });
  const db = await getDb();
  const [users, groups, newApplications] = await Promise.all([listUsers(db, user), listGroups(db, user, { includeArchived: true }), countNewApplications(db, user)]);
  const withMembers = await Promise.all(groups.map(async (g) => ({ ...g, members: (await listMembers(db, g.id)).map((m) => ({ id: m.id, role: m.role })) })));

  return (
    <div className="wrap page grid gap-4">
      <PageHead eyebrow="Admin" title={<>Lab <span className="hl">console</span></>}>
        Create accounts, form groups for each paper and choose who leads them. Only admins can create accounts.
      </PageHead>
      {newApplications > 0 && (
        <p className="note">
          <b>Join</b>
          <span>
            {newApplications} new application{newApplications === 1 ? "" : "s"} waiting.{" "}
            <Link href="/admin/applications" className="font-bold underline underline-offset-4">
              Open applications
            </Link>
          </span>
        </p>
      )}
      <section aria-labelledby="people">
        <SectionHead id="people" no={String(users.length).padStart(2, "0")} title="Accounts" />
        <AdminUsers users={users} me={user.id} prefill={{ name: name?.slice(0, 120) ?? "", email: email?.slice(0, 200) ?? "" }} />
      </section>
      <section className="section" aria-labelledby="groups">
        <SectionHead id="groups" no={String(groups.length).padStart(2, "0")} title="Groups" />
        <AdminGroups groups={JSON.parse(JSON.stringify(withMembers))} people={users.map((u) => ({ id: u.id, name: u.name, active: u.active }))} />
      </section>
    </div>
  );
}
