import { scoreColor } from "@/lib/widget/geo-badge";

export function scoreBandLabel(score: number): {
  label: string;
  description: string;
  color: string;
} {
  if (score <= 40) {
    return {
      label: "Needs work",
      description: "Rarely cited on tracked AI platforms — buyers may not see your brand in ChatGPT or Perplexity answers.",
      color: scoreColor(score),
    };
  }
  if (score <= 70) {
    return {
      label: "Good",
      description: "Cited on most tracked AI platforms — your brand shows up for some buyer prompts, with room to grow.",
      color: scoreColor(score),
    };
  }
  return {
    label: "Excellent",
    description: "Strong presence across AI answer engines — your brand is well positioned when buyers ask category questions.",
    color: scoreColor(score),
  };
}

export function formatScoreDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function faviconUrl(domain: string, size = 64): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
}
