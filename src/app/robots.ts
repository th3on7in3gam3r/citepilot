import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = site.url.replace(/\/$/, "");

  const disallowList = [
    "/admin",
    "/api/",
    "/dashboard/help",
    "/dashboard/analysis",
    "/dashboard/reddit",
    "/dashboard/communities",
    "/dashboard/sources",
    "/report/proof",
  ];

  return {
    rules: [
      // Default rule — all crawlers allowed except private paths
      {
        userAgent: "*",
        allow: "/",
        disallow: disallowList,
      },
      // --- AI crawlers explicitly welcomed ---
      // OpenAI / ChatGPT
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "OAI-SearchBot", allow: "/" },
      // Anthropic / Claude
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "Claude-Web", allow: "/" },
      { userAgent: "anthropic-ai", allow: "/" },
      // Perplexity
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Perplexity-User", allow: "/" },
      // Google AI / Gemini
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "Googlebot", allow: "/" },
      // Meta AI
      { userAgent: "meta-externalagent", allow: "/" },
      // Cohere
      { userAgent: "cohere-ai", allow: "/" },
      // Bing / Microsoft Copilot
      { userAgent: "bingbot", allow: "/" },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
