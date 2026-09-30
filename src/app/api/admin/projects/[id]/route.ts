import { createAdminDocumentHandlers } from "@/lib/api/admin-collections";

const handlers = createAdminDocumentHandlers("projects");

export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
