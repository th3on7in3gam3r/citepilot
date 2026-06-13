/** GEO quick-fix definitions shared by the dashboard modal and hosted snippet. */

export const SNIPPET_FIX_IDS = ["faq-schema", "org-schema"] as const;
export type SnippetFixId = (typeof SNIPPET_FIX_IDS)[number];

export type GeoFixDefinition = {
  id: string;
  title: string;
  description: string;
  instructions: string;
  filename: string;
  code: string;
  type: "json" | "html" | "text" | "xml";
  snippetCapable: boolean;
};

function formattedBrand(domain: string): string {
  const brandName = domain.split(".")[0] || "YourBrand";
  return brandName.charAt(0).toUpperCase() + brandName.slice(1);
}

export function isSnippetFixId(id: string): id is SnippetFixId {
  return (SNIPPET_FIX_IDS as readonly string[]).includes(id);
}

export function buildJsonLdBlock(fixId: SnippetFixId, domain: string): Record<string, unknown> {
  const brand = formattedBrand(domain);
  const root = domain.split(".")[0] || domain;

  if (fixId === "faq-schema") {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: `What is ${brand}?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `${brand} helps customers solve key problems efficiently and reliably.`,
          },
        },
        {
          "@type": "Question",
          name: `How does ${brand} compare to alternatives?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `${brand} offers strong performance, clear value, and an intuitive experience compared to alternatives.`,
          },
        },
      ],
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand,
    url: `https://${domain}`,
    logo: `https://${domain}/logo.png`,
    sameAs: [
      `https://twitter.com/${root}`,
      `https://linkedin.com/company/${root}`,
    ],
    description: `${brand} provides next-generation services for modern teams.`,
  };
}

export function getFixForGap(gap: string, domain: string): GeoFixDefinition {
  const lowercaseGap = gap.toLowerCase();

  if (lowercaseGap.includes("faqpage") || lowercaseGap.includes("faq schema")) {
    const block = buildJsonLdBlock("faq-schema", domain);
    return {
      id: "faq-schema",
      title: "Add FAQPage Schema (JSON-LD)",
      description:
        "AI search engines use FAQ schema to read direct answers to common user questions about your site.",
      instructions:
        "Enable in the GEO Snippet tab and paste the one-line script into your site head — or copy the JSON-LD below manually.",
      filename: "site-head",
      code: `<script type="application/ld+json">\n${JSON.stringify(block, null, 2)}\n</script>`,
      type: "json",
      snippetCapable: true,
    };
  }

  if (
    lowercaseGap.includes("organization") ||
    lowercaseGap.includes("json-ld") ||
    lowercaseGap.includes("entity")
  ) {
    const block = buildJsonLdBlock("org-schema", domain);
    return {
      id: "org-schema",
      title: "Add Organization Schema (JSON-LD)",
      description:
        "Organization schema defines your brand as a structured entity for AI models.",
      instructions:
        "Enable in the GEO Snippet tab and paste the one-line script into your site head — or copy the JSON-LD below manually.",
      filename: "site-head",
      code: `<script type="application/ld+json">\n${JSON.stringify(block, null, 2)}\n</script>`,
      type: "json",
      snippetCapable: true,
    };
  }

  if (lowercaseGap.includes("meta description")) {
    const brand = formattedBrand(domain);
    return {
      id: "meta-description",
      title: "Add Meta Description Tag",
      description:
        "A meta description provides a concise summary crawlers use for entity summaries.",
      instructions:
        "Paste this meta tag inside the <head> of your homepage (layout.tsx, index.html, or Framer Page Settings).",
      filename: "index.html / layout.tsx",
      code: `<meta name="description" content="Welcome to ${brand} — track and improve your AI citation footprint." />`,
      type: "html",
      snippetCapable: false,
    };
  }

  if (lowercaseGap.includes("h1")) {
    const brand = formattedBrand(domain);
    return {
      id: "h1",
      title: "Add H1 Heading",
      description:
        "An H1 heading helps crawlers understand the page's primary topic.",
      instructions:
        "Place this at the top of your main page body. Use only one H1 per page.",
      filename: "page.tsx / index.html",
      code: `<h1>Welcome to ${brand}</h1>`,
      type: "html",
      snippetCapable: false,
    };
  }

  if (lowercaseGap.includes("robots.txt") || lowercaseGap.includes("block crawlers")) {
    return {
      id: "robots",
      title: "Optimize robots.txt AI Bot Access",
      description:
        "AI bots read robots.txt to verify permission to scan your content.",
      instructions:
        "Create or update public/robots.txt (or your host's robots file) with the rules below.",
      filename: "public/robots.txt",
      code: `User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /`,
      type: "text",
      snippetCapable: false,
    };
  }

  if (lowercaseGap.includes("sitemap")) {
    return {
      id: "sitemap",
      title: "Create sitemap.xml",
      description:
        "A sitemap helps AI crawlers discover your key pages faster.",
      instructions:
        "Create public/sitemap.xml or configure your host/CMS sitemap.",
      filename: "public/sitemap.xml",
      code: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://${domain}/</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`,
      type: "xml",
      snippetCapable: false,
    };
  }

  if (
    lowercaseGap.includes("thin") ||
    lowercaseGap.includes("words") ||
    lowercaseGap.includes("content")
  ) {
    const brand = formattedBrand(domain);
    return {
      id: "content",
      title: "Add above-the-fold Answer Capsule",
      description:
        "Answer capsules give AI engines a dense, extractable summary of your brand.",
      instructions:
        "Place this block high on your homepage, above the fold.",
      filename: "page.tsx / index.html",
      code: `<section>
  <h2>What is ${brand}?</h2>
  <p>${brand} helps teams audit, track, and optimize AI citation visibility across ChatGPT, Perplexity, and Google AI.</p>
</section>`,
      type: "html",
      snippetCapable: false,
    };
  }

  const brand = formattedBrand(domain);
  return {
    id: "custom-content",
    title: "GEO Optimization Action Guide",
    description:
      "Write structured content matching the target query to improve citation retrievability.",
    instructions:
      "Create a landing page or blog post that directly addresses this topic with clear headings.",
    filename: "content-strategy",
    code: `# Target Query: "${gap}"

1. Answer the question in the first paragraph.
2. Structure comparisons with tables or lists.
3. Mention ${brand} with clear, factual claims.`,
    type: "text",
    snippetCapable: false,
  };
}
