import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth, isNeonAuthEnabled } from "@/lib/auth/server";
import { ADMIN_COOKIE, checkAdminAccess } from "@/lib/admin-auth";
import { corsHeaders, isAllowedCorsOrigin } from "@/lib/cors";
import { isDashboardSeoHubPath } from "@/lib/dashboard-seo-hubs";

const dashboardAuthProxy =
  isNeonAuthEnabled() && auth
    ? auth.middleware({ loginUrl: "/auth/sign-in" })
    : null;

const OAUTH_VERIFIER_PARAM = "neon_auth_session_verifier";

/** Browser CORS for /api/* — server-to-server calls omit Origin and skip this layer. */
function resolveApiCors(request: NextRequest): NextResponse | null {
  if (!request.nextUrl.pathname.startsWith("/api/")) return null;

  const origin = request.headers.get("origin");
  if (!origin) return null;

  if (!isAllowedCorsOrigin(origin)) {
    return NextResponse.json({ error: "CORS not allowed" }, { status: 403 });
  }

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
  }

  return null;
}

function withApiCorsHeaders(
  request: NextRequest,
  response: NextResponse,
): NextResponse {
  const origin = request.headers.get("origin");
  if (origin && isAllowedCorsOrigin(origin)) {
    for (const [key, value] of Object.entries(corsHeaders(origin))) {
      response.headers.set(key, value);
    }
  }
  return response;
}

const PRIMARY_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "getcitepilot.com",
  "www.getcitepilot.com",
]);

function hostFromRequest(request: NextRequest): string {
  return request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
}

function isPrimaryHost(host: string): boolean {
  if (!host) return true;
  if (PRIMARY_HOSTS.has(host)) return true;
  if (host.endsWith(".vercel.app")) return true;
  return false;
}

async function handleShortReportPath(request: NextRequest): Promise<NextResponse | null> {
  const shortMatch = request.nextUrl.pathname.match(/^\/r\/([^/]+)/);
  if (!shortMatch) return null;

  const token = shortMatch[1];
  const host = hostFromRequest(request);

  if (!isPrimaryHost(host)) {
    try {
      const verifyUrl = new URL("/api/white-label/resolve-host", request.url);
      verifyUrl.searchParams.set("host", host);
      const res = await fetch(verifyUrl.toString(), { cache: "no-store" });
      if (!res.ok) return NextResponse.next();
      const json = (await res.json()) as { verified?: boolean };
      if (!json.verified) {
        return NextResponse.json(
          { error: "Custom report domain is not verified for this host." },
          { status: 404 },
        );
      }
    } catch {
      return NextResponse.next();
    }
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = `/report/proof/${token}`;
  return NextResponse.rewrite(rewriteUrl);
}

async function handleProxy(request: NextRequest): Promise<NextResponse> {
  const shortReport = await handleShortReportPath(request);
  if (shortReport) return shortReport;

  const { pathname } = request.nextUrl;
  const hasOAuthVerifier = request.nextUrl.searchParams.has(OAUTH_VERIFIER_PARAM);

  const admin = checkAdminAccess(
    pathname,
    request.cookies.get(ADMIN_COOKIE)?.value,
  );
  if (admin.protected && !admin.allowed) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const login = new URL("/admin/login", request.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
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

export async function proxy(request: NextRequest) {
  const corsResponse = resolveApiCors(request);
  if (corsResponse) return corsResponse;

  const response = await handleProxy(request);
  return withApiCorsHeaders(request, response);
}

export const config = {
  matcher: [
    "/api/:path*",
    "/admin/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/auth/sign-in",
    "/auth/sign-up",
    "/r/:path*",
  ],
};
