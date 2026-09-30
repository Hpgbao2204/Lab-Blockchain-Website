import nextEnv from "@next/env";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const apply = process.argv.includes("--apply");
if (
  process.argv
    .slice(2)
    .some((argument) => argument !== "--apply" && argument !== "--dry-run")
) {
  throw new Error(
    "Usage: node scripts/migrate-owner-walls.mjs [--dry-run|--apply]",
  );
}

const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
if (!ownerEmail)
  throw new Error("OWNER_EMAIL is required before this migration can run.");
if (!projectId || !clientEmail || !privateKey)
  throw new Error(
    "Firebase Admin credentials are required before this migration can run.",
  );

const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
const auth = getAuth(app);
const db = getFirestore(app);
const owner = await auth.getUserByEmail(ownerEmail).catch(() => null);
if (!owner)
  throw new Error(
    `No Firebase Auth user exists for OWNER_EMAIL (${ownerEmail}).`,
  );

const [users, walls, tasks] = await Promise.all([
  db.collection("users").get(),
  db.collection("teams").get(),
  db.collection("tasks").get(),
]);
const changes = [];
const plan = (ref, data) => changes.push({ ref, data });
const activeMemberIds = new Set(
  users.docs
    .map((document) => document.data())
    .filter(
      (data) =>
        data.status === "active" &&
        data.role !== "owner" &&
        data.role !== "admin" &&
        typeof data.memberId === "string",
    )
    .map((data) => data.memberId),
);
let ownerRecordFound = false;

for (const document of users.docs) {
  const data = document.data();
  if (document.id === owner.uid) {
    ownerRecordFound = true;
    plan(document.ref, {
      uid: owner.uid,
      email: ownerEmail,
      role: "owner",
      status: "active",
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else if (data.role === "owner" || data.role === "admin")
    plan(document.ref, {
      status: "inactive",
      updatedAt: FieldValue.serverTimestamp(),
    });
}
if (!ownerRecordFound)
  plan(db.collection("users").doc(owner.uid), {
    uid: owner.uid,
    email: ownerEmail,
    role: "owner",
    status: "active",
    memberId: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

for (const document of walls.docs) {
  const data = document.data();
  const memberIds = [
    ...new Set([
      ...(Array.isArray(data.memberIds) ? data.memberIds.map(String) : []),
      ...(Array.isArray(data.mentorIds) ? data.mentorIds.map(String) : []),
    ]),
  ];
  const update = {
    memberIds,
    mentorIds: FieldValue.delete(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  const hasActiveMember = memberIds.some((memberId) =>
    activeMemberIds.has(memberId),
  );
  if (!hasActiveMember) update.isActive = false;
  if (
    JSON.stringify(memberIds) !== JSON.stringify(data.memberIds ?? []) ||
    "mentorIds" in data ||
    (!hasActiveMember && data.isActive !== false)
  )
    plan(document.ref, update);
}

for (const document of tasks.docs)
  if (document.data().status === "completed")
    plan(document.ref, {
      status: "accepted",
      updatedAt: FieldValue.serverTimestamp(),
    });

console.log(
  JSON.stringify(
    {
      mode: apply ? "apply" : "dry-run",
      ownerUid: owner.uid,
      plannedWrites: changes.length,
      users: users.size,
      walls: walls.size,
      tasks: tasks.size,
    },
    null,
    2,
  ),
);
if (!apply) process.exit(0);
for (let start = 0; start < changes.length; start += 450) {
  const batch = db.batch();
  for (const change of changes.slice(start, start + 450))
    batch.set(change.ref, change.data, { merge: true });
  await batch.commit();
}
console.log(`Applied ${changes.length} migration writes.`);
