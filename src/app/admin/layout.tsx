import type { Metadata } from "next";
import { AppBar } from "@/components/app/app-bar";
import { requirePageUser } from "@/server/auth/current";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser({ admin: true });
  return (
    <>
      <AppBar user={user} active="admin" />
      {children}
    </>
  );
}
