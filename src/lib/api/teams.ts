import type { Firestore } from "firebase-admin/firestore";
import type { UserSession } from "@/lib/api/auth";
import type { Team } from "@/types/content";

type RawRecord = Record<string, unknown>;
export type TeamAccess = "admin" | "member";
export type WallMemberSummary = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
};

function timestamp(value: unknown): string | undefined {
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as { toDate?: () => Date }).toDate?.().toISOString();
  }
  return typeof value === "string" ? value : undefined;
}

function ids(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

export function serializeTeam(id: string, data: RawRecord): Team {
  return {
    id,
    name: String(data.name ?? ""),
    slug: String(data.slug ?? ""),
    description: data.description ? String(data.description) : undefined,
    memberIds: ids(data.memberIds),
    isActive: data.isActive !== false,
    createdAt: timestamp(data.createdAt),
    updatedAt: timestamp(data.updatedAt),
    updatedBy: data.updatedBy ? String(data.updatedBy) : undefined
  };
}

export function getTeamsCollection(db: Firestore) {
  return db.collection("teams");
}

export function getTeamRef(db: Firestore, id: string) {
  return getTeamsCollection(db).doc(id);
}

export function isTeamAdmin(session: Pick<UserSession, "role">): boolean {
  return session.role === "owner";
}

export async function getTeamAccess(db: Firestore, session: UserSession, teamId: string): Promise<TeamAccess | null> {
  if (isTeamAdmin(session)) return "admin";
  if (!session.memberId) return null;

  const snapshot = await getTeamRef(db, teamId).get();
  if (!snapshot.exists) return null;
  const team = serializeTeam(snapshot.id, snapshot.data() ?? {});
  if (!team.isActive) return null;
  return team.memberIds.includes(session.memberId) ? "member" : null;
}

export async function getTeamsForSession(db: Firestore, session: UserSession): Promise<Team[]> {
  const snapshot = await getTeamsCollection(db).orderBy("name", "asc").get();
  const teams = snapshot.docs.map((document) => serializeTeam(document.id, document.data()));
  if (isTeamAdmin(session)) return teams;
  if (!session.memberId) return [];
  return teams.filter((team) => team.isActive && team.memberIds.includes(session.memberId!));
}

export async function hasLinkedProfiles(db: Firestore, memberIds: string[]): Promise<boolean> {
  const profiles = await Promise.all(memberIds.map((memberId) => db.collection("users").where("memberId", "==", memberId).limit(1).get()));
  return profiles.every((profile) =>
    profile.docs.some(
      (document) => document.data().status === "active" && document.data().role === "member"
    )
  );
}

export async function getActiveWallMemberIds(db: Firestore, memberIds: string[]): Promise<string[]> {
  const records = await Promise.all(memberIds.map(async (memberId) => {
    const [member, accounts] = await Promise.all([
      db.collection("members").doc(memberId).get(),
      db.collection("users").where("memberId", "==", memberId).limit(1).get(),
    ]);
    const profileIsActive = member.exists && member.data()?.isActive !== false;
    const hasActiveAccount = accounts.docs.some((document) => {
      const account = document.data();
      return account.status === "active" && account.role === "member";
    });
    return profileIsActive && hasActiveAccount ? memberId : null;
  }));

  return records.filter((memberId): memberId is string => Boolean(memberId));
}

export async function getWallMemberSummaries(db: Firestore, memberIds: string[]): Promise<WallMemberSummary[]> {
  // ponytail: research Walls are small; batch user lookups only if a Wall grows beyond the current member limit.
  return Promise.all(memberIds.map(async (memberId) => {
    const [member, accounts] = await Promise.all([
      db.collection("members").doc(memberId).get(),
      db.collection("users").where("memberId", "==", memberId).limit(1).get(),
    ]);
    const profile = member.data() ?? {};
    const account = accounts.docs[0]?.data() ?? {};
    return {
      id: memberId,
      name: String(profile.name ?? "Unknown member"),
      email: String(account.email ?? ""),
      role: String(profile.role ?? "Research member"),
      isActive: member.exists && profile.isActive !== false && account.status === "active",
    };
  }));
}
