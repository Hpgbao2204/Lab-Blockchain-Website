import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { isAuthError, jsonError, requireAdmin } from "@/lib/api/auth";
import { getOrcidWorks, hasOrcidCredentials, OrcidUpstreamError } from "@/lib/orcid/client";
import {
  findExistingPublication,
  normalizeOrcidWork,
  type ExistingPublication
} from "@/lib/orcid/normalize";

type SyncResult = {
  added: number;
  updated: number;
  skipped: number;
  syncRunId: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function toPutCodes(value: unknown): number[] {
  return Array.isArray(value)
    ? value.filter((item): item is number => typeof item === "number" && Number.isFinite(item))
    : [];
}

function existingPublications(snapshot: FirebaseFirestore.QuerySnapshot): ExistingPublication[] {
  return snapshot.docs.map((document) => {
    const data = asRecord(document.data());
    return {
      id: document.id,
      doi: asString(data.doi),
      title: asString(data.title),
      year: typeof data.year === "number" ? data.year : undefined,
      orcidPutCodes: toPutCodes(data.orcidPutCodes)
    };
  });
}

function syncFailureStatus(error: unknown): number {
  return error instanceof OrcidUpstreamError ? 502 : 500;
}

export async function POST(request: Request) {
  const session = await requireAdmin(request);
  if (isAuthError(session)) {
    return session;
  }

  if (!hasOrcidCredentials()) {
    return jsonError("ORCID Public API credentials are not configured", 503);
  }

  const db = getAdminDb();
  if (!db) {
    return jsonError("Firebase Admin is not configured", 503);
  }

  const homepageRef = db.collection("siteSettings").doc("homepage");
  const homepage = await homepageRef.get();
  const homepageData = homepage.exists ? asRecord(homepage.data()) : {};
  const orcidId = asString(homepageData.orcidId) ?? process.env.ORCID_ID?.trim();
  if (!orcidId) {
    return jsonError("ORCID iD is not configured", 503);
  }

  const syncRun = await db.collection("syncRuns").add({
    status: "running",
    orcidId,
    startedAt: FieldValue.serverTimestamp(),
    startedBy: session.uid
  });
  const startedAt = FieldValue.serverTimestamp();
  await homepageRef.set(
    {
      orcidSync: {
        status: "running",
        lastSyncAt: startedAt
      }
    },
    { merge: true }
  );

  try {
    const works = await getOrcidWorks(orcidId);
    const publicationSnapshot = await db.collection("publications").get();
    const currentPublications = existingPublications(publicationSnapshot);
    const result: SyncResult = { added: 0, updated: 0, skipped: 0, syncRunId: syncRun.id };

    for (const rawWork of works) {
      const work = normalizeOrcidWork(rawWork);
      if (!work) {
        result.skipped += 1;
        continue;
      }

      const existing = findExistingPublication(currentPublications, work);
      if (existing) {
        const orcidPutCodes = Array.from(new Set([...existing.orcidPutCodes, work.putCode]));
        await db.collection("publications").doc(existing.id).set(
          {
            title: work.title,
            authors: work.authors,
            ...(work.year ? { year: work.year } : {}),
            ...(work.venue ? { venue: work.venue } : {}),
            ...(work.type ? { type: work.type } : {}),
            ...(work.doi ? { doi: work.doi } : {}),
            ...(work.url ? { url: work.url } : {}),
            ...(work.abstract ? { abstract: work.abstract } : {}),
            externalIds: work.externalIds,
            orcidPutCodes,
            source: "orcid",
            updatedAt: FieldValue.serverTimestamp(),
            updatedBy: session.uid
          },
          { merge: true }
        );
        existing.doi = work.doi ?? existing.doi;
        existing.title = work.title;
        existing.year = work.year ?? existing.year;
        existing.orcidPutCodes = orcidPutCodes;
        result.updated += 1;
      } else {
        const created = await db.collection("publications").add({
          title: work.title,
          authors: work.authors,
          ...(work.year ? { year: work.year } : {}),
          ...(work.venue ? { venue: work.venue } : {}),
          ...(work.type ? { type: work.type } : {}),
          ...(work.doi ? { doi: work.doi } : {}),
          ...(work.url ? { url: work.url } : {}),
          ...(work.abstract ? { abstract: work.abstract } : {}),
          externalIds: work.externalIds,
          orcidPutCodes: [work.putCode],
          source: "orcid",
          isFeatured: false,
          isPublished: true,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: session.uid
        });
        currentPublications.push({
          id: created.id,
          doi: work.doi,
          title: work.title,
          year: work.year,
          orcidPutCodes: [work.putCode]
        });
        result.added += 1;
      }
    }

    await syncRun.set(
      {
        status: "succeeded",
        completedAt: FieldValue.serverTimestamp(),
        added: result.added,
        updated: result.updated,
        skipped: result.skipped
      },
      { merge: true }
    );
    await homepageRef.set(
      {
        orcidSync: {
          status: "succeeded",
          lastSuccessfulAt: FieldValue.serverTimestamp()
        }
      },
      { merge: true }
    );

    return Response.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ORCID sync failed";
    await syncRun.set(
      {
        status: "failed",
        completedAt: FieldValue.serverTimestamp(),
        error: message
      },
      { merge: true }
    );
    await homepageRef.set(
      {
        orcidSync: {
          status: "failed",
          lastError: message
        }
      },
      { merge: true }
    );

    return jsonError(message, syncFailureStatus(error));
  }
}
