import { body, route } from "@/lib/api/handler";
import { finishVenueImport, venueImportFinishInput } from "@/server/services/venues";

/** After the last chunk: `{ kind, run, prune }` removes the venues the file no longer lists. */
export const POST = route(async ({ db, user, req }) => finishVenueImport(db, user, await body(req, venueImportFinishInput)));
