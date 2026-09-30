import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { isAuthError, jsonError, requireAdmin } from "@/lib/api/auth";
import {
  type AdminContentCollection,
  parseAdminContentInput,
  parseApplicationStatusUpdate,
  parseSettingsUpdate
} from "@/lib/validation/content";
import { getSiteSettings } from "@/lib/data/public-content";

function serializeValue(value: unknown): unknown {
  if (value && typeof value === "object" && "toDate" in value) {
    const maybeTimestamp = value as { toDate?: () => Date };
    return maybeTimestamp.toDate?.().toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
        key,
        serializeValue(nestedValue)
      ])
    );
  }

  return value;
}

function serializeDocument(id: string, data: Record<string, unknown>) {
  return {
    id,
    ...serializeValue(data) as Record<string, unknown>
  };
}

async function getJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function getDbOrError() {
  const db = getAdminDb();
  if (!db) {
    return jsonError("Firebase Admin is not configured", 503);
  }
  return db;
}

const noClearFields = new Set<string>();
const clearableFieldsByCollection: Record<AdminContentCollection, ReadonlySet<string>> = {
  members: new Set([
    "bio",
    "avatar",
    "avatarUrl",
    "googleScholar",
    "orcid",
    "webOfScience",
    "scopus",
    "website",
    "github",
    "links.googleScholar",
    "links.orcid",
    "links.webOfScience",
    "links.scopus",
    "links.website",
    "links.github"
  ]),
  publications: new Set(["venue", "doi", "url", "abstract"]),
  projects: new Set([
    "description",
    "leader",
    "funding",
    "level",
    "type",
    "fundingAgency",
    "abstract",
    "objectives",
    "results",
    "url",
    "doi"
  ])
};
const clearableSettingsFields = new Set(["googleScholarUrl", "principalInvestigator.avatarUrl"]);

function extractClearFields(
  body: unknown,
  allowedFields: ReadonlySet<string>
): { input: Record<string, unknown>; clearFields: string[] } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { input: {}, clearFields: [] };
  }

  const record = body as Record<string, unknown>;
  if (record.__clearFields !== undefined && !Array.isArray(record.__clearFields)) {
    throw new Error("Invalid clear fields");
  }

  const clearFields = record.__clearFields ?? [];
  if (
    !clearFields.every(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0 && allowedFields.has(value)
    )
  ) {
    throw new Error("Invalid clear fields");
  }

  const input = { ...record };
  delete input.__clearFields;

  return { input, clearFields: [...new Set(clearFields)] };
}

function applyClearFields(payload: Record<string, unknown>, clearFields: string[]) {
  for (const fieldPath of clearFields) {
    if (fieldPath === "principalInvestigator.avatarUrl") {
      payload.principalInvestigator = {
        ...(payload.principalInvestigator as Record<string, unknown> | undefined),
        avatarUrl: FieldValue.delete()
      };
      continue;
    }

    if (fieldPath.startsWith("links.")) {
      const linkKey = fieldPath.slice("links.".length);
      payload.links = {
        ...(payload.links as Record<string, unknown> | undefined),
        [linkKey]: FieldValue.delete()
      };
      payload[linkKey] = FieldValue.delete();
      continue;
    }

    if (fieldPath === "avatar") {
      payload.avatar = FieldValue.delete();
      continue;
    }

    if (fieldPath === "avatarUrl") {
      payload.avatarUrl = FieldValue.delete();
      continue;
    }

    payload[fieldPath] = FieldValue.delete();
  }
}

export function createAdminCollectionHandlers(collectionName: AdminContentCollection) {
  return {
    async GET(request: Request) {
      const session = await requireAdmin(request);
      if (isAuthError(session)) {
        return session;
      }

      const db = getDbOrError();
      if (db instanceof Response) {
        return db;
      }

      const snapshot = await db.collection(collectionName).get();
      const data = snapshot.docs.map((doc) => serializeDocument(doc.id, doc.data()));
      return Response.json({ data });
    },

    async POST(request: Request) {
      const session = await requireAdmin(request);
      if (isAuthError(session)) {
        return session;
      }

      const db = getDbOrError();
      if (db instanceof Response) {
        return db;
      }

      const body = await getJsonBody(request);
      let input: Record<string, unknown>;
      let clearFields: string[];
      try {
        const extracted = extractClearFields(body, noClearFields);
        clearFields = extracted.clearFields;
        const rawInput = extracted.input;
        input = parseAdminContentInput(collectionName, rawInput);
      } catch {
        return jsonError(`Invalid ${collectionName} input`, 400);
      }

      applyClearFields(input, clearFields);
      const doc = await db.collection(collectionName).add({
        ...input,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: session.uid
      });

      return Response.json({ data: { id: doc.id } }, { status: 201 });
    }
  };
}

export function createAdminDocumentHandlers(collectionName: AdminContentCollection) {
  return {
    async PATCH(request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
      const session = await requireAdmin(request);
      if (isAuthError(session)) {
        return session;
      }

      const db = getDbOrError();
      if (db instanceof Response) {
        return db;
      }

      const body = await getJsonBody(request);
      let input: Record<string, unknown>;
      let clearFields: string[];
      try {
        const extracted = extractClearFields(body, clearableFieldsByCollection[collectionName]);
        clearFields = extracted.clearFields;
        const rawInput = extracted.input;
        input = parseAdminContentInput(collectionName, rawInput, true);
      } catch {
        return jsonError(`Invalid ${collectionName} input`, 400);
      }

      applyClearFields(input, clearFields);
      const params = await context.params;
      await db.collection(collectionName).doc(params.id).set(
        {
          ...input,
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: session.uid
        },
        { merge: true }
      );

      return Response.json({ data: { id: params.id } });
    },

    async DELETE(request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
      const session = await requireAdmin(request);
      if (isAuthError(session)) {
        return session;
      }

      const db = getDbOrError();
      if (db instanceof Response) {
        return db;
      }

      const params = await context.params;
      await db.collection(collectionName).doc(params.id).delete();

      return Response.json({ data: { id: params.id } });
    }
  };
}

export async function getAdminApplications(request: Request) {
  const session = await requireAdmin(request);
  if (isAuthError(session)) {
    return session;
  }

  const db = getDbOrError();
  if (db instanceof Response) {
    return db;
  }

  const snapshot = await db.collection("applications").orderBy("createdAt", "desc").get();
  return Response.json({
    data: snapshot.docs.map((doc) => serializeDocument(doc.id, doc.data()))
  });
}

export async function updateAdminApplication(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await requireAdmin(request);
  if (isAuthError(session)) {
    return session;
  }

  const db = getDbOrError();
  if (db instanceof Response) {
    return db;
  }

  const body = await getJsonBody(request);
  let input: { status: "pending" | "contacted" | "archived" };
  try {
    input = parseApplicationStatusUpdate(body);
  } catch {
    return jsonError("Invalid application status update", 400);
  }

  const params = await context.params;
  await db.collection("applications").doc(params.id).set(
    {
      ...input,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: session.uid
    },
    { merge: true }
  );

  return Response.json({ data: { id: params.id } });
}

export async function deleteAdminApplication(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await requireAdmin(request);
  if (isAuthError(session)) {
    return session;
  }

  const db = getDbOrError();
  if (db instanceof Response) {
    return db;
  }

  const params = await context.params;
  await db.collection("applications").doc(params.id).delete();
  return Response.json({ data: { id: params.id } });
}

export async function getAdminSettings(request: Request) {
  const session = await requireAdmin(request);
  if (isAuthError(session)) {
    return session;
  }

  return Response.json({ data: await getSiteSettings() });
}

export async function updateAdminSettings(request: Request) {
  const session = await requireAdmin(request);
  if (isAuthError(session)) {
    return session;
  }

  const db = getDbOrError();
  if (db instanceof Response) {
    return db;
  }

  const body = await getJsonBody(request);
  let input: Record<string, unknown>;
  let clearFields: string[];
  try {
    const extracted = extractClearFields(body, clearableSettingsFields);
    clearFields = extracted.clearFields;
    const rawInput = extracted.input;
    input = parseSettingsUpdate(rawInput);
  } catch {
    return jsonError("Invalid settings update", 400);
  }

  const shouldClearPiAvatar = clearFields.includes("principalInvestigator.avatarUrl");

  const reference = db.collection("siteSettings").doc("homepage");
  const existing = await reference.get();
  const existingData = existing.data() ?? {};
  const principalInvestigator = input.principalInvestigator
    ? {
        ...(existingData.principalInvestigator as Record<string, unknown> | undefined),
        ...(input.principalInvestigator as Record<string, unknown>)
      }
    : undefined;
  const featureFlags = input.featureFlags
    ? {
        ...(existingData.featureFlags as Record<string, unknown> | undefined),
        ...(input.featureFlags as Record<string, unknown>)
      }
    : undefined;

  await reference.set(
    {
      ...input,
      ...(principalInvestigator ? { principalInvestigator } : {}),
      ...(featureFlags ? { featureFlags } : {}),
      ...(clearFields.includes("googleScholarUrl") ? { googleScholarUrl: FieldValue.delete() } : {}),
      ...(shouldClearPiAvatar
        ? {
            principalInvestigator: {
              ...(principalInvestigator ?? (existingData.principalInvestigator as Record<string, unknown> | undefined) ?? {}),
              avatarUrl: FieldValue.delete()
            }
          }
        : {}),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: session.uid
    },
    { merge: true }
  );

  return Response.json({ data: await getSiteSettings() });
}
