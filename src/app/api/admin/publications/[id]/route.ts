import { createAdminDocumentHandlers } from "@/lib/api/admin-collections";

const handlers = createAdminDocumentHandlers("publications");

export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
