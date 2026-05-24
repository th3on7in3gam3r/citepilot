import { EDITORIAL_PILLARS } from "./constants";
import type { ContentType } from "./types";

export type EditorialCalendarSlot = {
  day: string;
  pillarId: (typeof EDITORIAL_PILLARS)[number]["id"];
  pillarTitle: string;
  contentType: ContentType;
  topicTemplate: string;
};

/** CitePilot.com editorial cadence template (3–5 posts/week) */
export function buildWeeklyEditorialMix(): EditorialCalendarSlot[] {
  return [
    {
      day: "Mon",
      pillarId: "geo",
      pillarTitle: "GEO & LLM Citations",
      contentType: "pillar",
      topicTemplate: "Ultimate guide: [primary keyword] for AI visibility",
    },
    {
      day: "Tue",
      pillarId: "seo-automation",
      pillarTitle: "SEO & Content Automation",
      contentType: "tutorial",
      topicTemplate: "How to [task] without sounding like AI slop",
    },
    {
      day: "Wed",
      pillarId: "technical-seo",
      pillarTitle: "Technical SEO",
      contentType: "tutorial",
      topicTemplate: "Checklist: [technical topic] for crawlability + schema",
    },
    {
      day: "Thu",
      pillarId: "paid-organic",
      pillarTitle: "Paid + Organic Synergy",
      contentType: "comparison",
      topicTemplate: "[Tool A] vs [Tool B] for SEO teams",
    },
    {
      day: "Fri",
      pillarId: "agency-growth",
      pillarTitle: "Agency Growth",
      contentType: "news",
      topicTemplate: "This week in AI search: [trend]",
    },
  ];
}
