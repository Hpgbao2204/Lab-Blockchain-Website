import { ProfileWorkspace } from "@/components/portal/profile-workspace";

export const metadata = { title: "My profile", robots: { index: false, follow: false } };

export default function ProfilePage() {
  return <ProfileWorkspace />;
}
