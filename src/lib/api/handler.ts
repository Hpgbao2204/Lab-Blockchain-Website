import "server-only";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { getDb, type Db } from "@/server/db";
import { getCurrentUser } from "@/server/auth/current";
import type { SessionUser } from "@/server/auth/sessions";
import { AppError } from "@/server/errors";
import { fail } from "./respond";

interface Ctx<P> {
  db: Db;
  user: SessionUser | null;
  params: P;
  req: Request;
}

/**
 * Wraps a private API route: resolves the session, blocks accounts that still have to change
 * their temporary password, rejects cross-site writes, and maps errors to the error envelope.
 */
export function route<P = Record<string, string>>(fn: (ctx: Ctx<P>) => Promise<unknown>, opts: { allowPasswordChange?: boolean } = {}) {
  return async (req: Request, ctx?: { params?: Promise<P> }) => {
    try {
      if (req.method !== "GET" && !sameOrigin(req)) return fail(403, "forbidden", "Cross-site request blocked.");
      const [db, user, params] = await Promise.all([getDb(), getCurrentUser(), ctx?.params ?? Promise.resolve({} as P)]);
      if (user?.mustChangePassword && !opts.allowPasswordChange) {
        return fail(403, "password_change_required", "Change your temporary password first.");
      }
      const data = await fn({ db, user, params, req });
      if (data instanceof Response) return data;
      return NextResponse.json({ data: data ?? null }, { headers: { "Cache-Control": "no-store" } });
    } catch (e) {
      if (e instanceof AppError) return fail(e.status, e.code, e.message);
      if (e instanceof ZodError) return fail(400, "invalid_input", "Some fields are invalid.", e.issues.map((i) => ({ field: i.path.join("."), message: i.message })));
      console.error(e);
      return fail(500, "internal", "Something went wrong.");
    }
  };
}

export async function body<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new AppError("invalid_input", "Request body must be JSON.");
  }
  return schema.parse(json);
}

function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser clients (curl, scripts)
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
