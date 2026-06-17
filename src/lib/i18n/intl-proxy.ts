import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export const intlMiddleware = createIntlMiddleware(routing);

const SKIP_PREFIXES = [
  "/api",
  "/dashboard",
  "/auth",
  "/admin",
  "/geo",
  "/report",
  "/r/",
  "/_next",
  "/_vercel",
];

export function shouldRunIntl(pathname: string): boolean {
  if (pathname.includes(".")) return false;
  return !SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
