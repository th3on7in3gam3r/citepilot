import {
  PROMPT_LIMIT_FREE,
  PROMPT_LIMIT_PILOT,
  WORKSPACE_LIMIT_FREE,
  WORKSPACE_LIMIT_PILOT,
} from "@/lib/billing/limits";
import { site } from "@/lib/site";

export type HelpGuide = {
  title: string;
  description: string;
  href: string;
  cta: string;
  external?: boolean;
};

export type HelpQuickAnswer = {
  q: string;
  a: string;
};

export type HelpWorkflowStep = {
  title: string;
  description: string;
  href?: string;
};

export const helpGuides: HelpGuide[] = [
  {
    title: "White-label report domain (CNAME)",
    description:
      "Point reports.youragency.com to CitePilot — step-by-step for Settings vs your DNS provider, with common mistakes.",
    href: "/help/white-label-reports",
    cta: "Open guide",
  },
  {
    title: "CMS publishing guide",
    description:
      "Connect Webflow, WordPress, Ghost, Shopify, or Framer and publish from the content queue.",
    href: "/help/cms-publishing",
    cta: "Open guide",
  },
  {
    title: "Plans & pricing",
    description:
      "Compare Free, Pilot, and Fleet — workspaces, prompt limits, weekly rescans, and alerts.",
    href: "/pricing",
    cta: "View pricing",
  },
  {
    title: "Workspace settings",
    description:
      "Domain, monitored prompts, competitors, Autopilot, email alerts, and Fleet API keys / CSV import.",
    href: "/dashboard/settings",
    cta: "Open settings",
  },
  {
    title: "Email support",
    description: "Stuck on setup, billing, or a CMS connection? We respond from the support inbox.",
    href: `mailto:${site.supportEmail}`,
    cta: "Email support",
    external: true,
  },
];

export const helpWorkflow: HelpWorkflowStep[] = [
  {
    title: "Sign up & onboard",
    description:
      "After signup you land on /start to confirm domain, business type, and your first money prompt. CitePilot creates your workspace and runs the first citation audit automatically.",
    href: "/start",
  },
  {
    title: "Review your baseline",
    description:
      "Open the dashboard for citation score, platform presence, gaps, and a trend chart (even a single audit shows your starting point). Re-run anytime from Settings or GEO Audit.",
    href: "/dashboard",
  },
  {
    title: "Set monitoring prompts",
    description: `In Settings, add one prompt per line under monitored prompts. Free allows ${PROMPT_LIMIT_FREE} per audit; Pilot ${PROMPT_LIMIT_PILOT}; Fleet unlimited.`,
    href: "/dashboard/settings",
  },
  {
    title: "Prove lift (Pilot & Fleet)",
    description:
      "Paid plans re-scan monitored prompts weekly (Mondays). Each run saves a citation snapshot so the chart, weekly lift, and “Since your last scan” card update over time.",
    href: "/dashboard/analytics",
  },
  {
    title: "Ship content & publish",
    description:
      "Generate a draft from a gap, then publish to your CMS from the content queue when you are ready.",
    href: "/dashboard/content",
  },
];

export const helpQuickAnswers: HelpQuickAnswer[] = [
  {
    q: "Where do I add the CNAME for white-label report links?",
    a: "In your own domain's DNS — not getcitepilot.com. If your agency site is youragency.com, open DNS for that domain (Cloudflare, Vercel, GoDaddy, etc.) and add: Name = reports, Type = CNAME, Value = reports.getcitepilot.com. In CitePilot Settings → White Label, enter reports.youragency.com. See /help/white-label-reports for the full walkthrough.",
  },
  {
    q: "Why does Vercel say the CNAME target cannot equal itself?",
    a: "You entered your own subdomain (e.g. reports.youragency.com) as the CNAME Value. Value must be reports.getcitepilot.com — CitePilot's server. Name creates your subdomain; Value points it to us.",
  },
  {
    q: "Do I need a CMS to use CitePilot?",
    a: "No. CMS publishing is optional. You can run audits, track prompts, view discussions, and generate articles without connecting a CMS.",
  },
  {
    q: "What are the plan limits?",
    a: `Free: ${WORKSPACE_LIMIT_FREE} workspace, up to ${PROMPT_LIMIT_FREE} prompts per audit. Pilot: up to ${WORKSPACE_LIMIT_PILOT} workspaces, ${PROMPT_LIMIT_PILOT} monitored prompts, weekly rescans, proof report emails, Autopilot, CMS publish, and email alerts — set monitoring email + agency name in Settings. Fleet: unlimited workspaces and prompts, full white-label on share links, JSON export, API keys, and CSV bulk prompt import.`,
  },
  {
    q: "How does weekly re-scanning work?",
    a: "Pilot and Fleet workspaces are eligible for automatic weekly citation rescans (scheduled Mondays). Each run stores a new audit and citation snapshot so your dashboard chart, weekly lift, and “Since your last scan” chips reflect real changes. You can also trigger a manual re-audit from Settings.",
  },
  {
    q: "What email alerts can I turn on?",
    a: "In Settings → Notifications: weekly citation digest, audit-complete emails, score-drop alerts (5+ points), competitor move alerts (Pilot+ — when prompts are lost or competitor-related gaps appear), weekly proof report emails (score delta + proof link + share URL), and discussion opportunity alerts. Set a monitoring email address on the same panel.",
  },
  {
    q: "What are competitor move alerts?",
    a: "After each audit, CitePilot compares results to your previous scan. Pilot and Fleet users with competitor move alerts enabled get an email when citation score, prompt wins/losses, or competitor-tagged gaps change meaningfully. Add competitors in Settings for sharper signals.",
  },
  {
    q: "How do I connect Google Search Console?",
    a: "Open Analytics → Google tab and connect Search Console for the workspace domain. Organic clicks and impressions appear alongside citation metrics when a matching property is found.",
  },
  {
    q: "What does Fleet add beyond Pilot?",
    a: "Unlimited client workspaces, unlimited monitored prompts, white-label proof reports, workspace JSON export, Fleet REST API (100 req/min, 1000/hour) with workspace-scoped keys, and CSV bulk import of prompts from Settings. See /docs/api for integration docs.",
  },
  {
    q: "Where is the getting-started checklist?",
    a: "On your main dashboard after onboarding — it tracks workspace setup, first audit, discussions, content generation, and optional CMS publish. Dismiss it anytime; progress is saved in your browser.",
  },
  {
    q: "How is product analytics tracked?",
    a: "Optional Plausible and PostHog scripts load when env vars are set. Events include audit start/complete, signup, workspace creation, checkout, CMS publish, and CitePilot Insights usage. Server API routes also send PostHog events when POSTHOG_KEY is configured.",
  },
  {
    q: "What is CitePilot Insights?",
    a: "One-shot AI guidance grounded in your workspace audit — not a general chat. On Overview, use “Prioritize with CitePilot” for your top 3 weekly actions. On GEO Audit, use “Explain with CitePilot” on any gap. Requires a completed audit and Pilot or Fleet.",
  },
  {
    q: "What is CitePilot Autopilot?",
    a: "Autopilot is a Pilot+ feature that runs after your weekly Monday re-scan. It summarizes what changed since the last scan, optionally generates a prioritized 7-day plan using CitePilot Insights, and can email a client-ready report with proof link and share URL to your monitoring email. Turn it on per workspace under Settings → CitePilot Autopilot, and you can also run it on-demand.",
  },
  {
    q: "Does Autopilot ever publish to my CMS?",
    a: "No. Autopilot never auto-publishes content. It only re-scans prompts, generates a plan, and (optionally) emails you. You remain in control of publishing from the Content tab or your CMS.",
  },
];
