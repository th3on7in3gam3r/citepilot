import { site } from "@/lib/site";

export function absoluteUrl(path = ""): string {
  const base = site.url.replace(/\/$/, "");
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
