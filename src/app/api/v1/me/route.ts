import { route } from "@/lib/api/handler";

/** The signed-in account, or `null` for visitors (200 either way, so public pages log no errors). */
export const GET = route(async ({ user }) => user, { allowPasswordChange: true });
