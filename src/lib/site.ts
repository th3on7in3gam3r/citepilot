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
    { label: "Product", href: "/#pillars" },
    { label: "Blog", href: "/blog" },
    { label: "GEO Playbook", href: "/nurture" },
    { label: "Pricing", href: "/pricing" },
  ],
  footer: {
    product: [
      { label: "How it works", href: "/#journey" },
      { label: "Features", href: "/#pillars" },
      { label: "Pricing", href: "/pricing" },
      { label: "Dashboard", href: "/dashboard" },
    ],
    tools: [
      { label: "Citation audit", href: "/audit" },
      { label: "Start analysis", href: "/start" },
    ],
    learn: [
      { label: "GEO Playbook", href: "/nurture" },
      { label: "ChatGPT prompts", href: "/chatgpt-prompts" },
      { label: "AI visibility", href: "/ai-visibility" },
      { label: "Blog", href: "/blog" },
      { label: "CMS publishing", href: "/help/cms-publishing" },
    ],
  },
  startAnalysis: { label: "Start Analysis", href: "/start" },
  cta: { label: "Free citation audit", href: "/audit" },
} as const;
