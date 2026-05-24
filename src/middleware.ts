import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE } from "@/lib/constants";
import { auth, isNeonAuthEnabled } from "@/lib/auth/server";

function isAdminApiPublic(pathname: string): boolean {
  return (
    pathname === "/api/admin/login" || pathname === "/api/admin/logout"
  );
}

const dashboardAuthMiddleware =
  isNeonAuthEnabled() && auth
    ? auth.middleware({ loginUrl: "/auth/sign-in" })
    : null;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const adminSecret = process.env.ADMIN_SECRET;
  if (adminSecret) {
    const isAdminPage =
      pathname.startsWith("/admin") && pathname !== "/admin/login";
    const isAdminApi =
      pathname.startsWith("/api/admin") && !isAdminApiPublic(pathname);

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
    dashboardAuthMiddleware &&
    (pathname === "/dashboard" || pathname.startsWith("/dashboard/"))
  ) {
    return dashboardAuthMiddleware(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/dashboard",
    "/dashboard/:path*",
  ],
};
