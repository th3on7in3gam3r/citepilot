/**
 * Known search / AI crawler User-Agents — used so SEO hub HTML stays
 * crawlable while human browsers still hit Neon Auth middleware.
 */
const CRAWLER_UA_RE =
  /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|linkedinbot|pinterest|redditbot|applebot|duckduckbot|yandex|baiduspider|sogou|exabot|ia_archiver|semrush|ahrefs|mj12bot|dotbot|petalbot|bytespider|gptbot|claudebot|anthropic|perplexity|google-extended|ccbot/i;

export function isCrawlerUserAgent(ua: string | null | undefined): boolean {
  if (!ua?.trim()) return false;
  return CRAWLER_UA_RE.test(ua);
}
