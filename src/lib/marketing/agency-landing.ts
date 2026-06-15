import { site } from "@/lib/site";

export const agencyLanding = {
  path: "/agency",
  title: "CitePilot for Agencies — Fleet GEO at scale",
  shortTitle: "Agencies & Fleet",
  description:
    "Citation proof for every client. Unlimited workspaces, white-label audit reports, bulk prompt import, and Fleet API — built for agencies at $249/mo.",
  hero: {
    headline: "Citation proof for every client. One workspace per brand.",
    sub: "Run unlimited GEO audits, deliver white-label reports, and show clients exactly where AI cites them — across ChatGPT, Perplexity, and Google AI.",
    cta: "Start with Fleet →",
    ctaHref: "/start?plan=fleet",
  },
} as const;

export const agencyPainPoints = {
  headline: "Your clients are asking about AI search. You don't have an answer yet.",
  items: [
    "You can't monitor citations for 10+ clients in a spreadsheet",
    "Client reports don't show AI visibility — they should",
    "Competitors are already offering GEO as a service",
  ],
} as const;

export const agencyFleetFeatures = [
  {
    title: "Unlimited client workspaces",
    body: "One login, all brands — separate audits, prompts, and history per client.",
    icon: "workspaces",
  },
  {
    title: "White-label audit reports",
    body: "Your logo, your agency name on share links and proof PDFs — not ours.",
    icon: "whitelabel",
  },
  {
    title: "CSV bulk prompt import",
    body: "Onboard a new client in minutes with a prompt list, not manual entry.",
    icon: "csv",
  },
  {
    title: "JSON export + API keys",
    body: "Plug citation data into your reporting stack, Looker, or client portals.",
    icon: "api",
  },
  {
    title: "Priority support",
    body: "When a client is waiting on a report, we respond like your team depends on it.",
    icon: "support",
  },
] as const;

export const agencyWorkflow = [
  {
    step: 1,
    title: "Onboard a new client in under 5 minutes",
    body: "Create a workspace, import money prompts from CSV, and set competitors.",
  },
  {
    step: 2,
    title: "Deliver a citation baseline in 60 seconds",
    body: "Run a full audit, then share a white-label report link the client can open.",
  },
  {
    step: 3,
    title: "Show citation lift in your monthly report",
    body: "Compare before/after scores, export proof data, and prove GEO ROI.",
  },
] as const;

export const agencyTestimonialAuthors = ["Marcus T.", "David M."] as const;

export const agencyPricing = {
  price: "$249",
  interval: "/mo",
  tagline: "Unlimited workspaces, white-label reports, API access",
  cta: "Start Fleet today →",
  href: "/start?plan=fleet",
} as const;

export const agencyFaqs = [
  {
    q: "Can clients log in directly?",
    a: "Yes. You can run everything from your agency account, or share read-only audit links without a login. Client-specific logins are on our roadmap — most agencies deliver via white-label share links today.",
  },
  {
    q: "Can I white-label the dashboard itself, not just reports?",
    a: "Fleet white-labels audit share links and proof PDF exports with your agency name and logo. Full dashboard white-label is available on request for multi-seat agency accounts — email hello@getcitepilot.com.",
  },
  {
    q: "Is there a setup fee?",
    a: "No setup fee. Fleet is $249/mo with unlimited workspaces. Start with one client workspace and scale as you add brands.",
  },
  {
    q: "Can I get invoiced instead of credit card billing?",
    a: "Annual Fleet billing via invoice is available for agencies on 12-month terms. Contact hello@getcitepilot.com with your company details and seat count.",
  },
  {
    q: "Do you have an agency partner program?",
    a: "We're building a partner tier with co-marketing and referral credits for agencies reselling GEO audits. Join the waitlist by emailing hello@getcitepilot.com with \"Agency partner\" in the subject.",
  },
] as const;

export const agencyFooterCta = {
  headline: "Ready to add GEO to your agency services?",
  primary: { label: "Start Fleet free trial", href: "/start?plan=fleet" },
  secondary: {
    label: "Book a demo",
    href: `mailto:${site.supportEmail}?subject=Book%20a%20Fleet%20demo`,
  },
} as const;
