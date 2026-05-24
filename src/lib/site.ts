export const site = {
  name: "CitePilot",
  tagline: "Get cited in AI answers — then prove it moved.",
  description:
    "Track brand citations across ChatGPT, Perplexity, and Google AI. Prioritize fixes, publish what matters, and measure citation lift week over week.",
  url: "https://getcitepilot.com",
  supportEmail: "hello@getcitepilot.com",
} as const;

export const nav = {
  main: [
    { label: "How it works", href: "/#journey" },
    { label: "Product", href: "/#pillars" },
    { label: "Blog", href: "/blog" },
    { label: "Pricing", href: "/pricing" },
  ],
  startAnalysis: { label: "Start Analysis", href: "/start" },
  cta: { label: "Free citation audit", href: "/audit" },
} as const;
