import { createAdminCollectionHandlers } from "@/lib/api/admin-collections";

const handlers = createAdminCollectionHandlers("members");

export const GET = handlers.GET;
export const POST = handlers.POST;
