export interface Endpoint {
  method: "GET" | "POST";
  path: string;
  summary: string;
  params?: string;
  /** milestone that ships it, when it is not live yet */
  planned?: string;
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
  { method: "POST", path: "/api/v1/auth/login", summary: "Sign in with an account created by the admin.", planned: "M2" },
  { method: "GET", path: "/api/v1/groups", summary: "Your monthly groups and their walls.", planned: "M5" },
];
