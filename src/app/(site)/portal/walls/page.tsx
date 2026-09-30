import { WallsWorkspace } from "@/components/portal/walls-workspace";

export const metadata = { title: "My walls", robots: { index: false, follow: false } };

export default function WallsPage() {
  return <WallsWorkspace />;
}
