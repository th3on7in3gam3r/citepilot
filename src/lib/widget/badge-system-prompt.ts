import { site } from "@/lib/site";

export type BadgeSystemPromptInput = {
  domain: string;
  badgeUrl: string;
  /** Click-through URL for the badge (usually audit CTA with ref=badge). */
  linkUrl: string;
  siteUrl?: string;
};

/**
 * SYSTEM_PROMPT users paste into Cursor / Claude / coding agents so the agent
 * embeds the GEO Score badge and creates/updates llms.txt for their project.
 */
export function buildBadgeSystemPrompt(input: BadgeSystemPromptInput): string {
  const domain = input.domain.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0]!;
  const citepilot = (input.siteUrl ?? site.url).replace(/\/$/, "");
  const badgeUrl = input.badgeUrl.trim();
  const linkUrl = input.linkUrl.trim();

  return `You are implementing GEO (Generative Engine Optimization) visibility assets for ${domain}.

## Goals
1. Embed the CitePilot GEO Score badge on the site (footer, docs, or README).
2. Create or update llms.txt at the site root (e.g. public/llms.txt or /llms.txt) so AI crawlers can discover canonical pages and the live badge.

## GEO Score badge
- Use this exact image URL (do not invent a score or swap the host):
  ${badgeUrl}
- Wrap it in a link to:
  ${linkUrl}
- Prefer HTML:
  <a href="${linkUrl}" target="_blank" rel="noopener noreferrer">
    <img src="${badgeUrl}" alt="GEO Score for ${domain} by CitePilot" width="170" height="28" />
  </a>
- Or equivalent React/Next.js JSX with the same href, src, and accessible alt text.
- Place one badge only (footer or docs sidebar). Do not remove existing brand logos.

## llms.txt
Create or merge a file at the site root named llms.txt with clear markdown-style sections covering:
- Site: ${domain}
- Product / docs / pricing / changelog URLs that already exist in the repo (do not invent URLs)
- A line noting the live GEO badge: ${badgeUrl}
- Optional: "Verified on CitePilot: ${citepilot}"

If llms.txt already exists, merge these entries without deleting unrelated content.

## Constraints
- Do not invent citation scores, fake audit results, or placeholder badge hosts.
- Keep the badge accessible (meaningful alt text).
- Prefer minimal diffs; match the project's existing layout and styling conventions.
- After changes, briefly tell the user where the badge and llms.txt were added.`;
}
