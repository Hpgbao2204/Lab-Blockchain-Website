import { Suspense } from "react";
import type { Metadata } from "next";
import { RefreshCw } from "lucide-react";
import { AdminLogin } from "@/components/admin/admin-login";

export const metadata: Metadata = {
  title: "Admin Sign In",
  robots: { index: false, follow: false }
};

function Loading() {
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <RefreshCw className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AdminLogin />
    </Suspense>
  );
}
