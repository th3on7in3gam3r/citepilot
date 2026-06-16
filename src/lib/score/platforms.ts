/** Primary AI platforms shown on public score pages (marketing-facing subset). */
export const PUBLIC_SCORE_PLATFORMS = [
  "ChatGPT",
  "Perplexity",
  "Google AI Overviews",
  "Gemini",
  "Copilot",
  "Claude",
] as const;

export type PublicScorePlatform = (typeof PUBLIC_SCORE_PLATFORMS)[number];

export const PLATFORM_SHORT_LABELS: Record<PublicScorePlatform, string> = {
  ChatGPT: "GPT",
  Perplexity: "Px",
  "Google AI Overviews": "GAI",
  Gemini: "Ge",
  Copilot: "Co",
  Claude: "Cl",
};
