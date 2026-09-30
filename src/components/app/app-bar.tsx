import Link from "next/link";
import type { SessionUser } from "@/server/auth/sessions";
import { SignOut } from "./sign-out";
import { Initials } from "./initials";

export function AppBar({ user, active }: { user: SessionUser; active: "app" | "admin" }) {
  return (
    <div className="app-bar">
      <div className="wrap app-bar-inner">
        <Initials name={user.name} />
        <span className="mr-2 whitespace-nowrap text-sm font-bold">{user.name}</span>
        <Link href="/app" className="nav-link" aria-current={active === "app" ? "page" : undefined}>
          My wall
        </Link>
        {user.role === "admin" && (
          <Link href="/admin" className="nav-link" aria-current={active === "admin" ? "page" : undefined}>
            Admin
          </Link>
        )}
        <Link href="/account/password" className="nav-link">
          Password
        </Link>
        <span className="ml-auto" />
        <SignOut />
      </div>
    </div>
  );
}
