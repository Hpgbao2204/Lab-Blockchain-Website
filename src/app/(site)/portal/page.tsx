import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Member portal",
  robots: { index: false, follow: false }
};

export default function PortalPage() {
  redirect("/portal/walls");
}
