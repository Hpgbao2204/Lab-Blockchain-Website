const ORCID_API_BASE_URL = "https://pub.orcid.org/v3.0";
const ORCID_TOKEN_URL = "https://orcid.org/oauth/token";

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export class OrcidConfigurationError extends Error {
  constructor() {
    super("ORCID Public API credentials are not configured");
  }
}

export class OrcidUpstreamError extends Error {
  constructor(message: string) {
    super(message);
  }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function hasOrcidCredentials(): boolean {
  return Boolean(process.env.ORCID_CLIENT_ID?.trim() && process.env.ORCID_CLIENT_SECRET?.trim());
}

async function getReadPublicToken(fetcher: FetchLike): Promise<string> {
  const clientId = process.env.ORCID_CLIENT_ID?.trim();
  const clientSecret = process.env.ORCID_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new OrcidConfigurationError();
  }

  const response = await fetcher(ORCID_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
      scope: "/read-public"
    })
  });

  if (!response.ok) {
    throw new OrcidUpstreamError(`ORCID token request failed with HTTP ${response.status}`);
  }

  const body = asRecord(await response.json());
  const token = asString(body?.access_token);
  if (!token) {
    throw new OrcidUpstreamError("ORCID token response did not include an access token");
  }

  return token;
}

function extractPutCodes(payload: unknown): number[] {
  const root = asRecord(payload);
  const groups = Array.isArray(root?.group) ? root.group : [];
  const putCodes = groups.flatMap((group) => {
    const groupRecord = asRecord(group);
    const summaries = Array.isArray(groupRecord?.["work-summary"])
      ? groupRecord["work-summary"]
      : [];
    return summaries
      .map((summary) => asNumber(asRecord(summary)?.["put-code"]))
      .filter((putCode): putCode is number => typeof putCode === "number");
  });

  return Array.from(new Set(putCodes));
}

function extractWorks(payload: unknown): unknown[] {
  const root = asRecord(payload);
  const bulk = Array.isArray(root?.bulk) ? root.bulk : [];

  return bulk
    .map((entry) => asRecord(entry)?.work)
    .filter((work): work is Record<string, unknown> => Boolean(asRecord(work)));
}

function headers(accessToken: string): HeadersInit {
  return {
    Accept: "application/vnd.orcid+json",
    Authorization: `Bearer ${accessToken}`
  };
}

export async function getOrcidWorks(orcidId: string, fetcher: FetchLike = fetch): Promise<unknown[]> {
  const accessToken = await getReadPublicToken(fetcher);
  const listResponse = await fetcher(`${ORCID_API_BASE_URL}/${encodeURIComponent(orcidId)}/works`, {
    headers: headers(accessToken)
  });

  if (!listResponse.ok) {
    throw new OrcidUpstreamError(`ORCID works request failed with HTTP ${listResponse.status}`);
  }

  const putCodes = extractPutCodes(await listResponse.json());
  const works: unknown[] = [];

  for (let index = 0; index < putCodes.length; index += 100) {
    const batch = putCodes.slice(index, index + 100);
    const response = await fetcher(
      `${ORCID_API_BASE_URL}/${encodeURIComponent(orcidId)}/works/${batch.join(",")}`,
      { headers: headers(accessToken) }
    );

    if (!response.ok) {
      throw new OrcidUpstreamError(`ORCID work batch request failed with HTTP ${response.status}`);
    }

    works.push(...extractWorks(await response.json()));
  }

  return works;
}
