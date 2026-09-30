"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { api } from "@/lib/api/client";

export function SignOut() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn btn-sm"
      onClick={async () => {
        await api("/auth/logout", { body: {} }).catch(() => undefined);
        router.replace("/login");
        router.refresh();
      }}
    >
      <LogOut size={15} aria-hidden /> Sign out
    </button>
  );
}
