import { NextResponse } from "next/server";
import type { ZodError } from "zod";

/** Public content changes rarely: let the CDN cache it and refresh in the background. */
const PUBLIC_CACHE = "public, s-maxage=300, stale-while-revalidate=86400";

export function ok<T>(data: T, meta?: Record<string, unknown>, init?: { cache?: boolean }) {
  return NextResponse.json(meta ? { data, meta } : { data }, {
    headers: init?.cache === false ? undefined : { "Cache-Control": PUBLIC_CACHE },
  });
}

/** Error envelope agreed in docs/ARCHITECTURE.md: `{ error: { code, message } }`. */
export function fail(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ error: { code, message, ...(details ? { details } : {}) } }, { status });
}

export function badQuery(err: ZodError) {
  return fail(
    400,
    "invalid_query",
    "One or more query parameters are invalid.",
    err.issues.map((i) => ({ param: i.path.join("."), message: i.message })),
  );
}

export const searchParamsObject = (url: string) => Object.fromEntries(new URL(url).searchParams);
