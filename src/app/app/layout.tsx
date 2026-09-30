import type { Metadata } from "next";
import { AppBar } from "@/components/app/app-bar";
import { requirePageUser } from "@/server/auth/current";

export const metadata: Metadata = { title: "My wall", robots: { index: false } };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser();
  return (
    <>
      <AppBar user={user} active="app" />
      {children}
    </>
  );
}
