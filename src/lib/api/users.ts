import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import type { User } from "@/types/content";

function db() {
  const database = getAdminDb();
  if (!database) {
    throw new Error("Firebase Admin is not configured");
  }
  return database;
}

export async function getUserByUid(uid: string): Promise<User | null> {
  const snapshot = await db().collection("users").doc(uid).get();
  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() as Record<string, unknown>;
  return {
    uid,
    email: String(data.email ?? ""),
    role: data.role as User["role"],
    status: data.status as User["status"],
    memberId: data.memberId ? String(data.memberId) : null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  };
}

export async function createUserRecord(
  user: Pick<User, "uid" | "email" | "role" | "status" | "memberId">
): Promise<User> {
  const now = FieldValue.serverTimestamp();
  const record: User = {
    uid: user.uid,
    email: user.email.toLowerCase(),
    role: user.role,
    status: user.status,
    memberId: user.memberId ?? null,
    createdAt: now,
    updatedAt: now
  };

  await db().collection("users").doc(user.uid).set(record);
  return record;
}

export async function updateUserRecord(
  uid: string,
  updates: Partial<Pick<User, "email" | "role" | "status" | "memberId">>
): Promise<User> {
  const snapshot = await db().collection("users").doc(uid).get();
  if (!snapshot.exists) {
    throw new Error("User record not found");
  }

  await db()
    .collection("users")
    .doc(uid)
    .set(
      {
        ...updates,
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

  const updated = await getUserByUid(uid);
  if (!updated) {
    throw new Error("User record not found after update");
  }
  return updated;
}

export async function bootstrapAdminUser(uid: string, email: string): Promise<User> {
  return createUserRecord({
    uid,
    email,
    role: "owner",
    status: "active",
    memberId: null
  });
}
