export interface Endpoint {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** who may call it; public when omitted */
  auth?: "public" | "member" | "admin";
  path: string;
  summary: string;
  params?: string;
}

/** Shown by `GET /api/v1` and the /developers page. */
export const endpoints: Endpoint[] = [
  { method: "GET", path: "/api/v1/stats", summary: "Headline numbers for the lab." },
  { method: "GET", path: "/api/v1/research", summary: "Research directions." },
  { method: "GET", path: "/api/v1/research/:slug", summary: "One research direction with its related publications." },
  { method: "GET", path: "/api/v1/publications", summary: "Publications, newest first, with facets.", params: "q, kind (journal|conference|article), year, area, limit" },
  { method: "GET", path: "/api/v1/members", summary: "Lab members (principal investigator for now)." },
  { method: "GET", path: "/api/v1/pioneers", summary: "Pioneers of cryptography and blockchain, with photo credits." },
  { method: "GET", path: "/api/v1/health", summary: "Liveness check." },
  { method: "POST", path: "/api/v1/auth/login", summary: "Sign in with an account created by the admin (sets a session cookie).", auth: "public" },
  { method: "POST", path: "/api/v1/auth/logout", summary: "Sign out.", auth: "member" },
  { method: "POST", path: "/api/v1/auth/change-password", summary: "Replace the temporary password.", auth: "member" },
  { method: "GET", path: "/api/v1/me", summary: "The signed-in account, or null for visitors." },
  { method: "GET", path: "/api/v1/me/tasks", summary: "Open tasks assigned to me or to my whole group.", auth: "member" },
  { method: "GET", path: "/api/v1/groups", summary: "My groups (admins see all).", auth: "member" },
  { method: "GET", path: "/api/v1/groups/:id", summary: "One group with its members.", auth: "member" },
  { method: "GET", path: "/api/v1/groups/:id/tasks", summary: "Tasks of a group; POST creates one (admin or lead).", auth: "member" },
  { method: "GET", path: "/api/v1/groups/:id/posts", summary: "The group wall; POST adds a note (announcements: admin or lead).", auth: "member" },
  { method: "PATCH", path: "/api/v1/tasks/:id", summary: "Update a task. Members may only change the status of their own tasks.", auth: "member" },
  { method: "GET", path: "/api/v1/tasks/:id/comments", summary: "Comments on a task; POST adds one.", auth: "member" },
  { method: "GET", path: "/api/v1/admin/users", summary: "All accounts; POST creates one and returns a temporary password.", auth: "admin" },
  { method: "PATCH", path: "/api/v1/admin/users/:id", summary: "Change role, title or deactivate. POST …/reset-password issues a new temporary password.", auth: "admin" },
  { method: "POST", path: "/api/v1/admin/groups", summary: "Create a group; PATCH …/:id edits or archives, PUT …/:id/members sets members and leads.", auth: "admin" },
];
