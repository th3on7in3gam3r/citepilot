import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE } from "@/lib/constants";
import { auth, isNeonAuthEnabled } from "@/lib/auth/server";
import { isDashboardSeoHubPath } from "@/lib/dashboard-seo-hubs";

function isAdminApiPublic(pathname: string): boolean {
  return pathname === "/api/admin/login" || pathname === "/api/admin/logout";
}

const dashboardAuthProxy =
  isNeonAuthEnabled() && auth
    ? auth.middleware({ loginUrl: "/auth/sign-in" })
    : null;

const OAUTH_VERIFIER_PARAM = "neon_auth_session_verifier";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasOAuthVerifier = request.nextUrl.searchParams.has(OAUTH_VERIFIER_PARAM);

  const adminSecret = process.env.ADMIN_SECRET;
  if (adminSecret) {
    const isAdminPage = pathname.startsWith("/admin") && pathname !== "/admin/login";
    const isAdminApi = pathname.startsWith("/api/admin") && !isAdminApiPublic(pathname);

    if (isAdminPage || isAdminApi) {
      const token = request.cookies.get(ADMIN_COOKIE)?.value;
      if (token !== adminSecret) {
        if (isAdminApi) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const login = new URL("/admin/login", request.url);
        login.searchParams.set("from", pathname);
        return NextResponse.redirect(login);
      }
    }
  }

  if (
    dashboardAuthProxy &&
    (hasOAuthVerifier || pathname === "/dashboard" || pathname.startsWith("/dashboard/"))
  ) {
    // OAuth verifier must not land on sign-in; exchange only runs on protected routes.
    if (
      hasOAuthVerifier &&
      (pathname.startsWith("/auth/sign-in") || pathname.startsWith("/auth/sign-up"))
    ) {
      const dashboard = new URL("/dashboard", request.url);
      request.nextUrl.searchParams.forEach((value, key) => {
        dashboard.searchParams.set(key, value);
      });
      return NextResponse.redirect(dashboard);
    }
    // Let crawlers and signed-out visitors read server-rendered hub SEO copy.
    if (
      request.method === "GET" &&
      !hasOAuthVerifier &&
      isDashboardSeoHubPath(pathname)
    ) {
      return NextResponse.next();
    }
    return dashboardAuthProxy(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/auth/sign-in",
    "/auth/sign-up",
  ],
};
