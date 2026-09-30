import { fail } from "@/lib/api/respond";

const notFound = () => fail(404, "not_found", "Unknown endpoint. See GET /api/v1 for the list.");

export { notFound as GET, notFound as POST, notFound as PUT, notFound as PATCH, notFound as DELETE };
