import { ADMIN_COOKIE } from "@/lib/constants";

export { ADMIN_COOKIE };

export function adminSecretFromEnv(): string | undefined {
  const value = process.env.ADMIN_SECRET?.trim();
  return value || undefined;
}

export function isAdminApiPublic(pathname: string): boolean {
  return pathname === "/api/admin/login" || pathname === "/api/admin/logout";
}

export function isAdminLoginPage(pathname: string): boolean {
  return pathname === "/admin/login";
}

/** Routes that require a valid admin cookie when ADMIN_SECRET is set. */
export function isAdminProtectedPath(pathname: string): boolean {
  if (isAdminLoginPage(pathname) || isAdminApiPublic(pathname)) return false;
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
}

export type AdminAccessResult = {
  /** False when ADMIN_SECRET is set and the cookie does not match. */
  allowed: boolean;
  /** True when ADMIN_SECRET is set and this path is admin-protected. */
  protected: boolean;
};

export function checkAdminAccess(
  pathname: string,
  adminCookie: string | undefined,
  adminSecret = adminSecretFromEnv(),
): AdminAccessResult {
  if (!adminSecret) {
    return { allowed: true, protected: false };
  }
  if (!isAdminProtectedPath(pathname)) {
    return { allowed: true, protected: false };
  }
  return {
    allowed: adminCookie === adminSecret,
    protected: true,
  };
}
