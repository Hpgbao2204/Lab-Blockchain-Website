import type { Metadata } from "next";
import { AppBar } from "@/components/app/app-bar";
import { ProfileEditor } from "@/components/app/profile-editor";
import { PageHead } from "@/components/site/page-head";
import { getDb } from "@/server/db";
import { requirePageUser } from "@/server/auth/current";
import { getProfileForEdit } from "@/server/services/profiles";

export const metadata: Metadata = { title: "My profile", robots: { index: false } };

type Props = { searchParams: Promise<{ user?: string }> };

/** Members edit their own public profile; the admin opens anyone's with `?user=<id>`. */
export default async function ProfilePage({ searchParams }: Props) {
  const user = await requirePageUser();
  const target = (await searchParams).user;
  const userId = user.role === "admin" && target ? target : user.id;
  const { user: owner, profile, saved } = await getProfileForEdit(await getDb(), user, userId);
  const { userId: _drop, updatedAt: _at, ...initial } = profile;
  void _drop;
  void _at;
  return (
    <>
      <AppBar user={user} />
      <div className="wrap page">
        <PageHead eyebrow="Profile" title={<>{userId === user.id ? "My" : `${owner.name}'s`} <span className="hl">profile</span></>}>
          Link the portfolio you designed yourself, or build a CV page here from a template. Nothing is public until you tick “Show on the People page”.
        </PageHead>
        <ProfileEditor userId={userId} name={owner.name} initial={initial} saved={saved} forAdmin={userId !== user.id} />
      </div>
    </>
  );
}
