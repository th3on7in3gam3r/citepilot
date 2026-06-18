import { founderName } from "@/lib/launch/config";
import { site } from "@/lib/site";

export const pressEmail = "press@getcitepilot.com";

export const pressOneLiner =
  "CitePilot is a B2B platform that tracks and improves brand citations in AI-generated answers on ChatGPT, Perplexity, Gemini, and Google AI.";

export const pressShortParagraph = `CitePilot helps B2B marketing teams and agencies answer a question traditional SEO tools cannot: whether AI assistants actually cite your brand when buyers ask for recommendations. The platform scans ChatGPT, Perplexity, Gemini, Google AI, Grok, and DeepSeek against your money prompts, surfaces citation gaps, and delivers a weekly ranked action plan — schema fixes, answer capsules, and content priorities — instead of a vague visibility score. Teams re-scan after shipping fixes to prove citation lift per prompt and share white-label proof reports with clients. CitePilot offers a free citation audit, a Pilot plan at $79/month for ongoing monitoring, and Fleet at $249/month for agencies managing multiple brands. Founded in 2025, CitePilot is built for the shift from search rankings to generative engine optimization (GEO).`;

export const pressKeyFacts = [
  { label: "Founded", value: site.foundingDate },
  { label: "Category", value: "GEO (Generative Engine Optimization)" },
  { label: "Pricing", value: "Free to $249/mo" },
  {
    label: "Platforms",
    value: "ChatGPT, Perplexity, Gemini, Google AI, Grok, DeepSeek",
  },
] as const;

export type PressLogoAsset = {
  id: string;
  label: string;
  svg: string;
  png: string;
};

export const pressLogoAssets: PressLogoAsset[] = [
  {
    id: "full-dark",
    label: "Logo full (dark background)",
    svg: "/press/logos/logo-full-dark.svg",
    png: "/api/og/press-logo/full-dark",
  },
  {
    id: "full-light",
    label: "Logo full (light background)",
    svg: "/press/logos/logo-full-light.svg",
    png: "/api/og/press-logo/full-light",
  },
  {
    id: "mark",
    label: "Logo mark only",
    svg: "/press/logos/logo-mark.svg",
    png: "/api/og/press-logo/mark",
  },
  {
    id: "wordmark",
    label: "Wordmark only",
    svg: "/press/logos/wordmark.svg",
    png: "/api/og/press-logo/wordmark",
  },
];

export type PressScreenshot = {
  id: string;
  caption: string;
  image: string;
  filename: string;
};

export const pressScreenshots: PressScreenshot[] = [
  {
    id: "heatmap",
    caption: "Citation heatmap — see every prompt × platform at a glance",
    image: "/api/og/ph-gallery/2",
    filename: "citepilot-screenshot-heatmap.png",
  },
  {
    id: "proof-report",
    caption: "Proof report — share citation lift with clients in one link",
    image: "/api/og/ph-gallery/5",
    filename: "citepilot-screenshot-proof-report.png",
  },
  {
    id: "action-plan",
    caption: "Weekly action plan — ranked fixes, not vague scores",
    image: "/api/og/ph-gallery/3",
    filename: "citepilot-screenshot-action-plan.png",
  },
  {
    id: "competitor-sov",
    caption: "Competitor share of voice — see who AI recommends instead of you",
    image: "/api/og/ph-gallery/4",
    filename: "citepilot-screenshot-competitor-sov.png",
  },
  {
    id: "prompt-tracking",
    caption: "Prompt tracking — monitor money prompts across AI engines",
    image: "/api/og/ph-gallery/6",
    filename: "citepilot-screenshot-prompt-tracking.png",
  },
  {
    id: "weekly-digest",
    caption: "Weekly digest email — citation changes delivered to your inbox",
    image: "/api/og/ph-gallery/7",
    filename: "citepilot-screenshot-weekly-digest.png",
  },
];

export const pressJournalistFaqs = [
  {
    question: "What is GEO?",
    answer:
      "GEO (Generative Engine Optimization) is the practice of improving how often and how prominently a brand appears in AI-generated answers — on ChatGPT, Perplexity, Google AI Overviews, and similar systems. Unlike traditional SEO, which optimizes for blue links, GEO focuses on being cited as a source inside the answer itself.",
  },
  {
    question: "How is CitePilot different from SEO tools?",
    answer:
      "SEO tools measure rankings, backlinks, and site health. CitePilot measures whether AI assistants actually mention your brand on buyer-intent prompts, ranks the fixes that improve citations, and re-scans to prove lift. It is built for citation outcomes in LLM answers, not just search engine result positions.",
  },
  {
    question: "Who uses CitePilot?",
    answer:
      "B2B marketing teams, growth leads, and SEO/GEO practitioners at SaaS companies use CitePilot to track AI citations. Agencies on the Fleet plan use white-label proof reports to show clients citation progress across multiple domains.",
  },
] as const;

export function pressFounderBio(): {
  name: string;
  bio: string;
  photo: string;
  twitter: string;
  linkedin: string;
  availableFor: string;
} {
  const name = founderName();
  const twitter =
    process.env.NEXT_PUBLIC_FOUNDER_TWITTER?.trim() ||
    process.env.FOUNDER_TWITTER?.trim() ||
    site.social.twitter;
  const linkedin =
    process.env.NEXT_PUBLIC_FOUNDER_LINKEDIN?.trim() ||
    process.env.FOUNDER_LINKEDIN?.trim() ||
    site.social.linkedin;
  const photo =
    process.env.NEXT_PUBLIC_FOUNDER_PHOTO?.trim() ||
    process.env.FOUNDER_PHOTO?.trim() ||
    "/press/founder-placeholder.svg";

  return {
    name,
    bio: `${name} founded CitePilot after repeatedly asking whether ChatGPT recommended their brand — and finding no tool that could answer reliably. CitePilot is the citation tracking and GEO action platform built for that gap.`,
    photo,
    twitter,
    linkedin,
    availableFor: "interviews, podcast appearances, expert quotes on GEO",
  };
}

/** Recent press mentions — add items when coverage exists. */
export const pressCoverage: { title: string; outlet: string; url: string; date?: string }[] =
  [];
