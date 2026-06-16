export const site = {
  name: "CitePilot",
  tagline: "Track citations in AI answers — then prove what moved.",
  homeTitle: "CitePilot | Generative Engine Optimization (GEO) Platform",
  description:
    "CitePilot is the top B2B platform to audit, track, and optimize brand citations on ChatGPT and Perplexity, offering the best alternatives to manual GEO.",
  url: "https://getcitepilot.com",
  /** Apex redirects static assets to www — use for OG images and logos in metadata. */
  wwwUrl: "https://www.getcitepilot.com",
  supportEmail: "hello@getcitepilot.com",
  foundingDate: "2025",
  social: {
    twitter: "https://twitter.com/citepilot",
    linkedin: "https://linkedin.com/company/citepilot",
  },
  /** Full logo for schema (1200×630 social preview served via /opengraph-image). */
  logoPath: "/images/branding/citepilot-logo-full.png",
  knowsAbout: [
    "Generative Engine Optimization",
    "AI citation tracking",
    "LLM visibility",
    "ChatGPT citations",
    "Perplexity citations",
  ],
} as const;

export const nav = {
  main: [
    { label: "How it works", href: "/#journey" },
    { label: "Product", href: "/product" },
    {
      label: "Free tools",
      href: "/tools/citation-checker",
      children: [
        {
          label: "Citation checker",
          href: "/tools/citation-checker",
          description: "One prompt · instant verdict · no account",
        },
        {
          label: "Full citation audit",
          href: "/audit",
          description: "10 prompts · 8 AI engines · shareable report",
        },
        {
          label: "Citation gap calculator",
          href: "/tools/citation-gap-calculator",
          description: "Estimate ROI gap by industry & competitors",
        },
        {
          label: "GEO Playbook",
          href: "/tools/geo-playbook",
          description: "42-item interactive checklist + PDF guide",
        },
        {
          label: "Chrome extension",
          href: "/chrome-extension",
          description: "Citation checker badge on any site you browse",
        },
      ],
    },
    { label: "Agencies", href: "/agency" },
    { label: "Pricing", href: "/pricing" },
  ],
  secondary: [
    { label: "Blog", href: "/blog" },
    { label: "Suggest a feature", href: "/feedback" },
    { label: "GEO Playbook", href: "/tools/geo-playbook" },
  ],
  footer: {
    product: [
      { label: "How it works", href: "/#journey" },
      { label: "Features", href: "/product" },
      { label: "Pricing", href: "/pricing" },
      { label: "Dashboard", href: "/dashboard" },
    ],
    tools: [
      { label: "Citation checker", href: "/tools/citation-checker" },
      { label: "Citation audit", href: "/audit" },
      { label: "Citation gap calculator", href: "/tools/citation-gap-calculator" },
      { label: "GEO Playbook", href: "/tools/geo-playbook" },
      { label: "Chrome extension", href: "/chrome-extension" },
      { label: "Start analysis", href: "/start" },
    ],
    compare: [
      { label: "vs Semrush", href: "/compare/semrush" },
      { label: "vs Ahrefs", href: "/compare/ahrefs" },
      { label: "vs Moz", href: "/compare/moz" },
      { label: "vs BrightEdge", href: "/compare/brightedge" },
      { label: "vs Conductor", href: "/compare/conductor" },
    ],
    company: [
      { label: "System Status", href: "/status" },
      { label: "Changelog", href: "/changelog" },
      { label: "API docs", href: "/docs/api" },
      { label: "Agencies", href: "/agency" },
    ],
      learn: [
      { label: "GEO Playbook", href: "/tools/geo-playbook" },
      { label: "ChatGPT prompts", href: "/chatgpt-prompts" },
      { label: "AI visibility", href: "/ai-visibility" },
      { label: "Blog", href: "/blog" },
      { label: "CMS publishing", href: "/help/cms-publishing" },
    ],
  },
  startAnalysis: { label: "Start Analysis", href: "/start" },
  cta: { label: "Free citation audit", href: "/audit" },
} as const;

export function siteLogoUrl(): string {
  return `${site.wwwUrl.replace(/\/$/, "")}${site.logoPath}`;
}

export function siteSocialProfiles(): string[] {
  return [site.social.twitter, site.social.linkedin];
}
