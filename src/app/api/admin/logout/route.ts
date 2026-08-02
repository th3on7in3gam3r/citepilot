import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/constants";
import { withApiLogging } from "@/lib/observability/api-log";

export const GET = withApiLogging(async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url));
  response.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
});
