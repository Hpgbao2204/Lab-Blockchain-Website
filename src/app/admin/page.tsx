import { Suspense } from "react";
import { RefreshCw } from "lucide-react";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const metadata = {
  title: "Admin"
};

function Loading() {
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <RefreshCw className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AdminDashboard />
    </Suspense>
  );
}
