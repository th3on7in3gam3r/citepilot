import { site } from "@/lib/site";

export const legalLastUpdated = "May 24, 2026";

export type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export const termsOfService: LegalSection[] = [
  {
    title: "Agreement",
    paragraphs: [
      `These Terms of Service ("Terms") govern your use of ${site.name} ("CitePilot," "we," "us") at ${site.url} and related services. By creating an account, running an audit, or subscribing to a paid plan, you agree to these Terms.`,
      "If you do not agree, do not use the service.",
    ],
  },
  {
    title: "What CitePilot provides",
    paragraphs: [
      "CitePilot offers tools to analyze how your brand may appear in AI-generated answers, prioritize citation gaps, generate content, and publish to connected CMS platforms when configured.",
      "Audit results, scores, and recommendations are informational. We do not guarantee rankings, citations, traffic, or revenue outcomes.",
    ],
  },
  {
    title: "Accounts",
    paragraphs: [
      "You must provide accurate information and keep your credentials secure. You are responsible for activity under your account.",
      "You must be at least 18 years old (or the age of majority in your jurisdiction) to use paid features.",
    ],
  },
  {
    title: "Acceptable use",
    paragraphs: ["You agree not to:"],
    bullets: [
      "Use the service for unlawful, deceptive, or abusive purposes",
      "Attempt to bypass rate limits, access controls, or other users' data",
      "Scrape or resell the service without written permission",
      "Submit content that infringes others' intellectual property or privacy rights",
      "Use generated content without reviewing it for accuracy and compliance",
    ],
  },
  {
    title: "Subscriptions and billing",
    paragraphs: [
      "Paid plans (e.g. Pilot, Fleet) are billed in advance via Stripe unless stated otherwise. Prices are shown at checkout and may change with notice for future billing periods.",
      "You may cancel through the billing portal or by contacting us. Cancellation stops future charges; access typically continues through the end of the paid period unless otherwise stated.",
      "Refunds are handled case by case unless required by law. Chargebacks without contacting support first may result in account suspension.",
    ],
  },
  {
    title: "Free audit",
    paragraphs: [
      "The free citation audit is offered at our discretion. We may limit frequency, prompts, or features to prevent abuse.",
    ],
  },
  {
    title: "Your content",
    paragraphs: [
      "You retain ownership of domains, prompts, and content you submit. You grant us a limited license to process that data to operate the service (audits, generation, publishing you request, support).",
      "You represent that you have the right to submit and publish content for any domain or brand you analyze.",
    ],
  },
  {
    title: "Third-party services",
    paragraphs: [
      "CitePilot integrates with third parties (e.g. OpenAI, Neon, Stripe, Webflow, search APIs). Their terms and privacy policies apply to those services. We are not responsible for third-party outages or policy changes.",
    ],
  },
  {
    title: "Disclaimer of warranties",
    paragraphs: [
      'The service is provided "as is" and "as available" without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, and non-infringement.',
    ],
  },
  {
    title: "Limitation of liability",
    paragraphs: [
      "To the maximum extent permitted by law, CitePilot and its operators will not be liable for indirect, incidental, special, consequential, or punitive damages, or loss of profits, data, or goodwill.",
      "Our total liability for any claim relating to the service is limited to the amount you paid us in the twelve (12) months before the claim, or one hundred US dollars ($100), whichever is greater.",
    ],
  },
  {
    title: "Changes",
    paragraphs: [
      "We may update these Terms. We will post the revised version with an updated date. Continued use after changes constitutes acceptance.",
    ],
  },
  {
    title: "Contact",
    paragraphs: [
      `Questions about these Terms: ${site.supportEmail}.`,
    ],
  },
];

export const privacyPolicy: LegalSection[] = [
  {
    title: "Overview",
    paragraphs: [
      `${site.name} ("CitePilot," "we") respects your privacy. This Privacy Policy explains what we collect, how we use it, and your choices when you use ${site.url} and our dashboard.`,
    ],
  },
  {
    title: "Information we collect",
    paragraphs: ["Depending on how you use CitePilot, we may collect:"],
    bullets: [
      "Account data — email and authentication identifiers (via Neon Auth)",
      "Workspace data — domain, business description, competitors, buyer prompts, preferences",
      "Audit and usage data — prompts analyzed, scores, gaps, generated content, publish actions",
      "Billing data — subscription status and Stripe customer IDs (payment cards are handled by Stripe, not stored by us)",
      "Technical data — IP address, browser type, and logs for security and debugging",
      "Communications — support emails and waitlist sign-ups",
    ],
  },
  {
    title: "How we use information",
    paragraphs: ["We use data to:"],
    bullets: [
      "Provide audits, dashboards, content generation, and CMS publishing you request",
      "Authenticate users and secure accounts",
      "Process subscriptions and send billing-related messages",
      "Improve the product and fix errors",
      "Respond to support requests and legal obligations",
    ],
  },
  {
    title: "AI and automated processing",
    paragraphs: [
      "Audits and article generation use third-party AI providers (e.g. OpenAI). Content you submit may be sent to those providers to produce results. Do not submit secrets or highly sensitive personal data.",
      "You are responsible for reviewing AI-generated content before publishing.",
    ],
  },
  {
    title: "Sharing",
    paragraphs: [
      "We do not sell your personal information. We share data with service providers that help us operate CitePilot, such as:",
      "We may disclose information if required by law or to protect rights, safety, and integrity of the service.",
    ],
    bullets: [
      "Neon (database and authentication)",
      "Stripe (payments)",
      "OpenAI and other AI/search APIs (product features you use)",
      "Webflow or other CMS platforms when you publish",
      "Hosting and infrastructure providers",
    ],
  },
  {
    title: "Retention and deletion",
    paragraphs: [
      "We retain data while your account is active and as needed for legal, billing, and security purposes.",
      "You can delete a workspace from Settings. You can delete your account and all associated data at any time from Settings → Account. We process deletion requests within 30 days.",
      "Stripe payment records required for tax compliance may be retained for up to 7 years in accordance with applicable law.",
    ],
  },
  {
    title: "Your right to deletion",
    paragraphs: [
      "Under GDPR and similar laws, you have the right to request erasure of your personal data. Use Settings → Account → Delete my account to start a verified deletion request.",
      "You may download a copy of your data first (data portability) from the same screen. After requesting deletion, you will receive a confirmation email with a link to cancel within 7 days if the request was made in error.",
    ],
  },
  {
    title: "Cookies",
    paragraphs: [
      "We use essential cookies for authentication and session management. If we add analytics cookies later, we will update this policy and provide appropriate controls where required.",
    ],
  },
  {
    title: "Security",
    paragraphs: [
      "We use industry-standard measures including encrypted connections and access controls. No method of transmission or storage is 100% secure.",
    ],
  },
  {
    title: "International users",
    paragraphs: [
      "If you access CitePilot from outside the United States, your data may be processed in the US or where our providers operate.",
    ],
  },
  {
    title: "Children",
    paragraphs: [
      "CitePilot is not directed at children under 13 (or 16 in the EEA). We do not knowingly collect data from children.",
    ],
  },
  {
    title: "Your rights",
    paragraphs: [
      "Depending on your location, you may have rights to access, correct, delete, or export personal data, or object to certain processing. Contact us to exercise these rights.",
    ],
  },
  {
    title: "Changes",
    paragraphs: [
      "We may update this Privacy Policy. The \"Last updated\" date at the top reflects the latest version.",
    ],
  },
  {
    title: "Contact",
    paragraphs: [
      `Privacy questions or requests: ${site.supportEmail}.`,
    ],
  },
];
