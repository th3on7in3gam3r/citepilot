import {
  adminEmailsFromEnv,
  isAdminEmail,
  isAdminProtectedPath,
} from "@/lib/admin/emails";

export { ADMIN_COOKIE } from "@/lib/constants";

/** @deprecated Use ADMIN_EMAILS + Neon session instead. Kept for legacy cookie logout. */
export function adminSecretFromEnv(): string | undefined {
  const value = process.env.ADMIN_SECRET?.trim();
  return value || undefined;
}

export function isAdminApiPublic(pathname: string): boolean {
  return (
    pathname === "/api/admin/logout" ||
    pathname === "/api/admin/impersonation/status"
  );
}

export function isAdminLoginPage(_pathname: string): boolean {
  return false;
}

export { isAdminProtectedPath, isAdminEmail, adminEmailsFromEnv };

export type AdminAccessResult = {
  allowed: boolean;
  protected: boolean;
};

/** Sync helper retained for tests — use checkAdminEmailAccess in proxy. */
export function checkAdminAccess(
  pathname: string,
  _adminCookie: string | undefined,
  _adminSecret = adminSecretFromEnv(),
): AdminAccessResult {
  if (!isAdminProtectedPath(pathname)) {
    return { allowed: true, protected: false };
  }
  if (adminEmailsFromEnv().length === 0) {
    return { allowed: false, protected: true };
  }
  return { allowed: false, protected: true };
}

export async function checkAdminEmailAccess(
  pathname: string,
  email: string | null | undefined,
): Promise<AdminAccessResult> {
  if (!isAdminProtectedPath(pathname)) {
    return { allowed: true, protected: false };
  }
  if (adminEmailsFromEnv().length === 0) {
    return { allowed: false, protected: true };
  }
  return {
    allowed: isAdminEmail(email),
    protected: true,
  };
}
