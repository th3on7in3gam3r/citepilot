/** GEO quick-fix definitions shared by the dashboard modal and hosted snippet. */

export const SNIPPET_FIX_IDS = ["faq-schema", "org-schema"] as const;
export type SnippetFixId = (typeof SNIPPET_FIX_IDS)[number];

export type GeoFixCategory = "snippet" | "deploy" | "content" | "strategy";

export type GeoFixDefinition = {
  id: string;
  title: string;
  description: string;
  instructions: string;
  filename: string;
  code: string;
  type: "json" | "html" | "text" | "xml";
  snippetCapable: boolean;
  category: GeoFixCategory;
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

function extractPromptFromGap(gap: string): string | null {
  const match = gap.match(/prompt:\s*"([^"]+)"/i);
  return match?.[1] ?? null;
}

export function getFixActionLabel(gap: string, domain: string): string {
  const fix = getFixForGap(gap, domain);
  if (fix.category === "snippet") return "Quick Fix";
  if (fix.category === "content" || fix.category === "strategy") return "Content guide";
  return "Deploy fix";
}

export function getFixForGap(gap: string, domain: string): GeoFixDefinition {
  const lower = gap.toLowerCase();
  const brand = formattedBrand(domain);

  // Prompt-specific gaps — must run before any generic "content" match.
  if (lower.includes("doesn't support prompt") || lower.includes("does not support prompt")) {
    const prompt = extractPromptFromGap(gap) ?? "your money prompt";
    return {
      id: "prompt-content",
      title: `Publish content for: "${prompt}"`,
      description:
        "This gap means your live site lacks a clear, extractable answer to a buyer question AI engines are checking. That is a content task — not a schema toggle.",
      instructions:
        "Add a dedicated section or page that answers this prompt in the first paragraph, with headings, comparisons, and factual claims about your product.",
      filename: "content-strategy",
      code: `# Target prompt: "${prompt}"

## Above-the-fold answer (40–60 words)
Write one paragraph that directly answers "${prompt}" and names ${brand}.

## Supporting structure
- H2: Who ${brand} is best for
- H2: How ${brand} compares to alternatives
- Bulleted proof points (features, outcomes, social proof)

## Checklist
1. Use the exact buyer language from the prompt in an H2 or FAQ question.
2. Place the answer high on a page crawlers index (homepage or /solutions).
3. Re-run your GEO audit after publishing.`,
      type: "text",
      snippetCapable: false,
      category: "content",
    };
  }

  if (lower.includes("could not be fetched") || lower.includes("check ssl")) {
    return {
      id: "fetch-error",
      title: "Restore homepage availability",
      description:
        "CitePilot could not fetch your homepage. Technical fixes must come before schema or content work.",
      instructions:
        "Verify DNS, SSL certificate, and that the root URL returns HTTP 200 without auth walls.",
      filename: "infrastructure",
      code: `# Homepage fetch failed for ${domain}

1. Open https://${domain} in a browser — confirm it loads.
2. Check SSL: openssl s_client -connect ${domain}:443 -servername ${domain}
3. Confirm no firewall, geo-block, or bot challenge on the homepage.
4. If on Vercel/Cloudflare, verify the apex domain is attached to the project.`,
      type: "text",
      snippetCapable: false,
      category: "deploy",
    };
  }

  if (lower.includes("meta description")) {
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
      category: "deploy",
    };
  }

  if (lower.includes("faqpage") || lower.includes("faq schema")) {
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
      category: "snippet",
    };
  }

  if (lower.includes("organization schema") || lower.includes("no organization schema")) {
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
      category: "snippet",
    };
  }

  if (lower.includes("json-ld") || lower.includes("structured data")) {
    const block = buildJsonLdBlock("faq-schema", domain);
    return {
      id: "faq-schema",
      title: "Add FAQPage Schema (JSON-LD)",
      description:
        "No structured data was detected. FAQPage schema is the highest-impact starting point for AI answer extraction.",
      instructions:
        "Enable in the GEO Snippet tab and paste the one-line script into your site head — or copy the JSON-LD below manually.",
      filename: "site-head",
      code: `<script type="application/ld+json">\n${JSON.stringify(block, null, 2)}\n</script>`,
      type: "json",
      snippetCapable: true,
      category: "snippet",
    };
  }

  if (lower.includes("entity signal") || lower.includes("weak entity")) {
    const block = buildJsonLdBlock("org-schema", domain);
    return {
      id: "org-schema",
      title: "Strengthen brand entity signals",
      description:
        "AI models rely on consistent Organization schema and third-party mentions to recognize your brand entity.",
      instructions:
        "Add Organization JSON-LD, then build citations on review sites and directories that mention your brand consistently.",
      filename: "site-head",
      code: `<script type="application/ld+json">\n${JSON.stringify(block, null, 2)}\n</script>`,
      type: "json",
      snippetCapable: true,
      category: "snippet",
    };
  }

  if (lower.includes("h1")) {
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
      category: "deploy",
    };
  }

  if (lower.includes("robots.txt") || lower.includes("block crawlers")) {
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
      category: "deploy",
    };
  }

  if (lower.includes("sitemap")) {
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
      category: "deploy",
    };
  }

  if (
    lower.includes("thin homepage") ||
    lower.includes("answer capsule") ||
    lower.includes("<300 words")
  ) {
    return {
      id: "answer-capsule",
      title: "Add an above-the-fold answer capsule",
      description:
        "This is a content change — not a one-click schema fix. AI engines extract concise summaries from the top of your page.",
      instructions:
        "Place a 40–60 word paragraph high on your homepage that states what you do, who you serve, and why you are credible.",
      filename: "page.tsx / index.html",
      code: `<section aria-label="Answer capsule">
  <h2>What is ${brand}?</h2>
  <p>${brand} helps teams audit, track, and optimize AI citation visibility across ChatGPT, Perplexity, and Google AI.</p>
</section>`,
      type: "html",
      snippetCapable: false,
      category: "content",
    };
  }

  if (lower.includes("competitor cited") || lower.includes("competitor")) {
    return {
      id: "competitor-gap",
      title: "Close the competitor citation gap",
      description:
        "A rival is cited more often on your money prompts. You need differentiated, prompt-matching content and third-party mentions.",
      instructions:
        "Publish comparison content, earn reviews, and ensure schema + answer capsules support your top prompts.",
      filename: "content-strategy",
      code: `# Competitor citation gap

Gap: ${gap}

1. Identify which prompts the competitor wins (Competitors tab).
2. Publish a comparison page: "${brand} vs [competitor]".
3. Add FAQ schema questions that mirror buyer prompts.
4. Earn mentions on G2, Capterra, or niche directories.`,
      type: "text",
      snippetCapable: false,
      category: "strategy",
    };
  }

  return {
    id: "custom-content",
    title: "GEO optimization action guide",
    description:
      "Write structured content matching the target query to improve citation retrievability.",
    instructions:
      "Create a landing page or blog post that directly addresses this topic with clear headings.",
    filename: "content-strategy",
    code: `# Target gap: "${gap}"

1. Answer the underlying buyer question in the first paragraph.
2. Structure comparisons with tables or lists.
3. Mention ${brand} with clear, factual claims.`,
    type: "text",
    snippetCapable: false,
    category: "strategy",
  };
}
