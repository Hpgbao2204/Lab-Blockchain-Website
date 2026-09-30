import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { isAuthError, jsonError, requireUser } from "@/lib/api/auth";
import { normalizeMemberRecord, normalizePublicationRecord } from "@/lib/data/public-content";
import { isValidOrcidUrl, parsePortalProfileUpdate } from "@/lib/validation/users";

function getDbOrError() {
  const db = getAdminDb();
  return db ?? jsonError("Firebase Admin is not configured", 503);
}

function cleanRecord(record: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

async function referencesArePublic(
  db: NonNullable<ReturnType<typeof getAdminDb>>,
  collection: "publications" | "projects",
  ids: string[]
) {
  const documents = await Promise.all(ids.map((id) => db.collection(collection).doc(id).get()));
  return documents.every((document) => {
    if (!document.exists) return false;
    return collection !== "publications" || normalizePublicationRecord(document.id, document.data() ?? {}).isPublished;
  });
}

async function getMemberForSession(request: Request) {
  const session = await requireUser(request);
  if (isAuthError(session)) return session;
  if (!session.memberId) return jsonError("A member profile is required", 403);

  const db = getDbOrError();
  if (db instanceof Response) return db;

  const member = await db.collection("members").doc(session.memberId).get();
  if (!member.exists) return jsonError("Member profile was not found", 404);

  return { db, session, member };
}

export async function GET(request: Request) {
  const result = await getMemberForSession(request);
  if (result instanceof Response) return result;

  return Response.json({ data: normalizeMemberRecord(result.member.id, result.member.data() ?? {}) });
}

export async function PATCH(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid profile update input", 400);
  }

  let input: ReturnType<typeof parsePortalProfileUpdate>;
  try {
    input = parsePortalProfileUpdate(body);
  } catch {
    return jsonError("Invalid profile update input", 400);
  }

  const result = await getMemberForSession(request);
  if (result instanceof Response) return result;

  if (input.publicationIds && !(await referencesArePublic(result.db, "publications", input.publicationIds))) {
    return jsonError("Publication references must be published records", 400);
  }
  if (input.projectIds && !(await referencesArePublic(result.db, "projects", input.projectIds))) {
    return jsonError("Project references must be public records", 400);
  }
  const existing = result.member.data() ?? {};
  const inputLinks = input.links;
  const links =
    inputLinks && typeof inputLinks === "object" && !Array.isArray(inputLinks)
      ? cleanRecord({
          ...(typeof existing.links === "object" && existing.links && !Array.isArray(existing.links)
            ? existing.links as Record<string, unknown>
            : {}),
          ...(inputLinks as Record<string, unknown>)
        })
      : undefined;
  const updates = cleanRecord({ ...input, ...(links ? { links } : {}) });
  delete updates.links;
  if (links) updates.links = links;

  const finalOrcid = links ? links.orcid : (existing.links as Record<string, unknown> | undefined)?.orcid;
  if (!isValidOrcidUrl(finalOrcid)) {
    return jsonError("ORCID là bắt buộc và phải có dạng https://orcid.org/0000-0000-0000-0000.", 400);
  }

  await result.db.collection("members").doc(result.member.id).set(
    {
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: result.session.uid
    },
    { merge: true }
  );

  return Response.json({
    data: normalizeMemberRecord(result.member.id, {
      ...existing,
      ...updates,
      ...(links ? { links } : {})
    })
  });
}
