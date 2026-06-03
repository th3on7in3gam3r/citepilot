export const site = {
  name: "CitePilot",
  tagline: "Get cited in AI answers — then prove it moved.",
  description:
    "Track brand citations across ChatGPT, Perplexity, Google AI Overviews, Grok, DeepSeek, and other AI answer surfaces. Prioritize fixes, publish what matters, and measure citation lift week over week.",
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
      { label: "Pricing", href: "/pricing" },
      { label: "Free citation audit", href: "/audit" },
      { label: "Start analysis", href: "/start" },
      { label: "Dashboard", href: "/dashboard" },
    ],
    resources: [
      { label: "GEO Playbook", href: "/nurture" },
      { label: "Blog", href: "/blog" },
      { label: "CMS publishing guide", href: "/help/cms-publishing" },
    ],
  },
  startAnalysis: { label: "Start Analysis", href: "/start" },
  cta: { label: "Free citation audit", href: "/audit" },
} as const;
