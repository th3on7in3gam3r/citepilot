export type Brand = {
  id: string;
  name: string;
  short: string;
  color: string;
};

export const scrollBrands: Brand[] = [
  { id: "openai", name: "ChatGPT", short: "GPT", color: "#10a37f" },
  { id: "perplexity", name: "Perplexity", short: "PPLX", color: "#20b8cd" },
  { id: "google", name: "Google AI", short: "G", color: "#4285f4" },
  { id: "anthropic", name: "Claude", short: "C", color: "#d97757" },
  { id: "xai", name: "Grok", short: "GX", color: "#d4d4d8" },
  { id: "deepseek", name: "DeepSeek", short: "DS", color: "#4f46e5" },
  { id: "hubspot", name: "HubSpot", short: "HS", color: "#ff7a59" },
  { id: "semrush", name: "Semrush", short: "SR", color: "#ff642d" },
  { id: "webflow", name: "Webflow", short: "WF", color: "#146ef5" },
  { id: "shopify", name: "Shopify", short: "S", color: "#96bf48" },
  { id: "notion", name: "Notion", short: "N", color: "#000000" },
  { id: "stripe", name: "Stripe", short: "St", color: "#635bff" },
];
