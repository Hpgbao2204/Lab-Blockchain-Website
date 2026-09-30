const ADMIN_PATH = /^\/admin(?:[/?#]|$)/;

export function getSafeAdminRedirect(redirect: string | null): string {
  return redirect && ADMIN_PATH.test(redirect) ? redirect : "/admin";
}
