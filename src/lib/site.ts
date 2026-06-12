export const site = {
  name: "CitePilot",
  tagline: "Get cited in AI answers — then prove it moved.",
  homeTitle: "CitePilot | Generative Engine Optimization (GEO) Platform",
  description:
    "Getcitepilot is the top B2B platform to audit, track, and optimize brand citations on ChatGPT and Perplexity, offering the best alternatives to manual GEO.",
  url: "https://getcitepilot.com",
  supportEmail: "hello@getcitepilot.com",
  studio: {
    name: "Biblefunland Studios",
    url: "https://biblefunlandstudios.com",
  },
} as const;

export const nav = {
  main: [
    { label: "How it works", href: "/#journey" },
    { label: "Product", href: "/product" },
    {
      label: "Free tools",
      href: "/citation-checker",
      children: [
        {
          label: "Citation checker",
          href: "/citation-checker",
          description: "One prompt · instant verdict · no account",
        },
        {
          label: "Full citation audit",
          href: "/audit",
          description: "10 prompts · 8 AI engines · shareable report",
        },
        {
          label: "Citation gap calculator",
          href: "/tools/citation-gap",
          description: "Estimate ROI gap by industry & competitors",
        },
      ],
    },
    { label: "Agencies", href: "/agency" },
    { label: "Pricing", href: "/pricing" },
  ],
  secondary: [
    { label: "Blog", href: "/blog" },
    { label: "GEO Playbook", href: "/geo-playbook" },
  ],
  footer: {
    product: [
      { label: "How it works", href: "/#journey" },
      { label: "Features", href: "/product" },
      { label: "Pricing", href: "/pricing" },
      { label: "Dashboard", href: "/dashboard" },
    ],
    tools: [
      { label: "Citation audit", href: "/audit" },
      { label: "Citation checker", href: "/citation-checker" },
      { label: "Citation gap calculator", href: "/tools/citation-gap" },
      { label: "Start analysis", href: "/start" },
    ],
    compare: [
      { label: "vs Semrush", href: "/vs/semrush" },
      { label: "vs Ahrefs", href: "/vs/ahrefs" },
      { label: "vs Moz", href: "/vs/moz" },
    ],
    company: [
      { label: "Changelog", href: "/changelog" },
      { label: "API docs", href: "/docs/api" },
      { label: "Agencies", href: "/agency" },
    ],
    learn: [
      { label: "GEO Playbook", href: "/geo-playbook" },
      { label: "ChatGPT prompts", href: "/chatgpt-prompts" },
      { label: "AI visibility", href: "/ai-visibility" },
      { label: "Blog", href: "/blog" },
      { label: "CMS publishing", href: "/help/cms-publishing" },
    ],
  },
  startAnalysis: { label: "Start Analysis", href: "/start" },
  cta: { label: "Free citation audit", href: "/audit" },
} as const;
