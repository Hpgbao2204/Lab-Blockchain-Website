export function getWallDestination(slug: string, role: "owner" | "member") {
  const encodedSlug = encodeURIComponent(slug);
  return role === "owner" ? `/admin?wall=${encodedSlug}` : `/portal/walls/${encodedSlug}`;
}
