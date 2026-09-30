import type { SessionUser } from "@/server/auth/sessions";
import { AppNav } from "./app-nav";
import { SignOut } from "./sign-out";
import { Initials } from "./initials";

export function AppBar({ user }: { user: SessionUser; active?: string }) {
  return (
    <div className="app-bar">
      <div className="wrap app-bar-inner">
        <Initials name={user.name} />
        <span className="mr-2 whitespace-nowrap text-sm font-bold">{user.name}</span>
        <AppNav admin={user.role === "admin"} />
        <span className="ml-auto" />
        <SignOut />
      </div>
    </div>
  );
}
