import type { MetadataRoute } from "next";
import { countPostsByPillar, getAllPosts } from "@/lib/blog";
import { EDITORIAL_PILLARS } from "@/lib/content-strategy";
import { DASHBOARD_SEO_HUB_PATHS } from "@/lib/dashboard-seo-hubs";
import { competitors } from "@/lib/data/competitors";
import { routing } from "@/i18n/routing";
import { listPublicScoreDomains } from "@/lib/score/domain-profiles";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

const LOCALIZED_MARKETING_PATHS = ["", "/pricing", "/agency"] as const;

function localeUrl(base: string, locale: string, path: string): string {
  const normalized = path.startsWith("/") ? path : path ? `/${path}` : "";
  if (locale === routing.defaultLocale) return `${base}${normalized}`;
  return `${base}/${locale}${normalized}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = site.wwwUrl.replace(/\/$/, "");
  const routes = [
    ...LOCALIZED_MARKETING_PATHS,
    "/audit",
    "/start",
    "/blog",
    "/product",
    "/tools/citation-checker",
    "/tools/citation-gap-calculator",
    "/tools/geo-playbook",
    "/chatgpt-prompts",
    "/ai-visibility",
    "/docs/api",
    "/changelog",
    "/status",
    "/terms",
    "/privacy",
    ...competitors.map((c) => `/compare/${c.slug}`),
    ...DASHBOARD_SEO_HUB_PATHS,
  ];

  const toolPaths = new Set([
    "/tools/citation-checker",
    "/tools/citation-gap-calculator",
    "/tools/geo-playbook",
  ]);

  const staticEntries = routes.flatMap((path) => {
    if (LOCALIZED_MARKETING_PATHS.includes(path as (typeof LOCALIZED_MARKETING_PATHS)[number])) {
      return routing.locales.map((locale) => ({
        url: localeUrl(base, locale, path),
        lastModified: new Date(),
        changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
        priority: path === "" ? 1 : path === "/pricing" || path === "/agency" ? 0.85 : 0.7,
      }));
    }

    return [
      {
        url: `${base}${path}`,
        lastModified: new Date(),
        changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
        priority: path === "" ? 1 : toolPaths.has(path) || path === "/audit" ? 0.9 : 0.7,
      },
    ];
  });

  let posts: Awaited<ReturnType<typeof getAllPosts>> = [];
  try {
    posts = await getAllPosts();
  } catch {
    // Neon/SQLite unavailable at build time — static routes only
  }

  const postEntries = posts.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const pillarCounts = countPostsByPillar(posts);
  const categoryEntries = EDITORIAL_PILLARS.filter(
    (p) => (pillarCounts[p.id] ?? 0) > 0,
  ).map((p) => ({
    url: `${base}/blog/category/${p.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.55,
  }));

  let scoreEntries: MetadataRoute.Sitemap = [];
  try {
    const scoreDomains = await listPublicScoreDomains();
    scoreEntries = scoreDomains.map(({ domain, lastModified }) => ({
      url: `${base}/score/${encodeURIComponent(domain)}`,
      lastModified: new Date(lastModified),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    // DB unavailable — skip dynamic score pages
  }

  return [...staticEntries, ...postEntries, ...categoryEntries, ...scoreEntries];
}
