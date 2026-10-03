import { body, route } from "@/lib/api/handler";
import { addPublication, listAdminPublications } from "@/server/services/publications";
import { publicationInput } from "@/server/validation";

/** Every paper with its source (snapshot or manual) and whether it is hidden. */
export const GET = route(async ({ db, user }) => listAdminPublications(db, user));

export const POST = route(async ({ db, user, req }) => addPublication(db, user, await body(req, publicationInput)));
