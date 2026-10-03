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
  { method: "GET", path: "/api/v1/news", summary: "Lab news, newest first. POST (admin) adds one; admins may pass all=1 for drafts.", params: "limit, all" },
  { method: "GET", path: "/api/v1/news/:slug", summary: "One published news item. PATCH and DELETE …/:id (admin)." },
  { method: "POST", path: "/api/v1/applications", summary: "Apply to join the lab (rate-limited). GET (admin) lists applications; PATCH/DELETE …/:id.", auth: "public" },
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
  { method: "GET", path: "/api/v1/groups/:id/links", summary: "Overleaf, GitHub and other links. POST adds one: group-wide (admin or lead) or on a task you work on.", auth: "member" },
  { method: "DELETE", path: "/api/v1/links/:id", summary: "Remove a link (whoever added it, a lead or the admin).", auth: "member" },
  { method: "GET", path: "/api/v1/groups/:id/attachments", summary: "Files on the wall. POST multipart `file` (PDF or image, max 10 MB) and optional `taskId`.", auth: "member" },
  { method: "POST", path: "/api/v1/groups/:id/attachments/direct", summary: "Start a direct upload `{ size, mime, taskId? }`: returns a signed URL to PUT the file to, then POST `{ key, name, taskId? }` to /groups/:id/attachments.", auth: "member" },
  { method: "GET", path: "/api/v1/attachments/:id", summary: "Download a file (group members only); DELETE removes it.", auth: "member", params: "download" },
  { method: "PATCH", path: "/api/v1/tasks/:id", summary: "Update a task. Members may only change the status of their own tasks.", auth: "member" },
  { method: "GET", path: "/api/v1/tasks/:id/comments", summary: "Comments on a task; POST adds one.", auth: "member" },
  { method: "GET", path: "/api/v1/profiles/me", summary: "Your profile for the editor (admin: /profiles/:userId). PUT saves it: portfolio link or CV sections, template, published.", auth: "member" },
  { method: "GET", path: "/api/v1/meetings", summary: "Lab meetings with their presenters. POST (admin) schedules one and emails every member; PATCH/DELETE …/:id.", auth: "member", params: "when (upcoming|past)" },
  { method: "GET", path: "/api/v1/announcements", summary: "Lab-wide announcements. POST (admin) posts one and emails every member.", auth: "member" },
  { method: "GET", path: "/api/v1/admin/presenters", summary: "Who presented how often and when last, longest-ago first.", auth: "admin" },
  { method: "GET", path: "/api/v1/admin/publications", summary: "Every paper with its source and hidden flag. POST adds one; PATCH …/:id edits it or sets { hidden }; DELETE removes one added here.", auth: "admin" },
  { method: "GET", path: "/api/v1/admin/users", summary: "All accounts; POST creates one and returns a temporary password.", auth: "admin" },
  { method: "PATCH", path: "/api/v1/admin/users/:id", summary: "Change role, title or deactivate. POST …/reset-password issues a new temporary password.", auth: "admin" },
  { method: "POST", path: "/api/v1/admin/groups", summary: "Create a group; PATCH …/:id edits or archives, PUT …/:id/members sets members and leads.", auth: "admin" },
  { method: "GET", path: "/api/v1/admin/reports", summary: "Monthly progress per paper group and member.", auth: "admin", params: "month (YYYY-MM), format (json|csv)" },
  { method: "GET", path: "/api/v1/admin/digest", summary: "Preview this Monday's deadline emails; POST sends them now.", auth: "admin" },
];
