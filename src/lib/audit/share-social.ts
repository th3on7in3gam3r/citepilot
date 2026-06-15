export type ShareExpiry = "7d" | "30d" | "never";

export function buildShareTweet(input: {
  domain: string;
  score: number;
  citedPrompts: number;
  totalPrompts: number;
  reportUrl: string;
}): string {
  const platformHint =
    input.totalPrompts > 0
      ? `ChatGPT cites us on ${input.citedPrompts} of ${input.totalPrompts} prompts 📊.`
      : "Tracking AI citation visibility 📊.";
  return [
    `Just ran a CitePilot audit on ${input.domain} — our GEO Score is ${input.score}/100.`,
    platformHint,
    `Tracking AI citations weekly with @CitePilot 🔗 ${input.reportUrl}`,
  ].join("\n");
}

export function linkedInShareUrl(reportUrl: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(reportUrl)}`;
}

export function twitterShareUrl(text: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}
