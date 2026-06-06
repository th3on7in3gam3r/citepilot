import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = site.url.replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api/",
        "/dashboard/help",
        "/dashboard/analysis",
        "/dashboard/reddit",
        "/dashboard/communities",
        "/dashboard/sources",
        "/report/proof",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
