import { body, route } from "@/lib/api/handler";
import { importVenueRows, venueImportInput, venueStats } from "@/server/services/venues";

/** How many venues of each kind there are and when they were last imported. */
export const GET = route(async ({ db, user }) => venueStats(db, user));

/** One chunk (up to 1000 rows) of a conference or journal CSV; see /admin/venues. */
export const POST = route(async ({ db, user, req }) => importVenueRows(db, user, await body(req, venueImportInput)));
