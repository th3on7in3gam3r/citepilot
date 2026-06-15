export type OnboardingAnswers = {
  domain: string;
  businessType: string;
  description: string;
  audiences: string[];
  competitors: string[];
  buyerQuestion: string;
  referral: string;
};

export const ONBOARDING_STORAGE_KEY = "citepilot_onboarding";
export const ONBOARDING_WELCOME_TOAST_KEY = "citepilot_welcome_toast";
export const TOTAL_STEPS = 5;

export type StepMeta = {
  id: string;
  stepLabel: string;
  title: string;
  subtitle: string;
  optional?: boolean;
};

export const stepMeta: StepMeta[] = [
  {
    id: "website",
    stepLabel: "Let's begin",
    title: "What's your website?",
    subtitle: "We'll analyze it to see where AI assistants mention you today.",
  },
  {
    id: "category",
    stepLabel: "Step 2",
    title: "What best describes your business?",
    subtitle: "We tailor citation tracking and benchmarks to your category.",
  },
  {
    id: "describe",
    stepLabel: "Step 3",
    title: "Describe your business",
    subtitle: "The more context you share, the better we can prioritize AI visibility gaps.",
  },
  {
    id: "competitors",
    stepLabel: "Step 4",
    title: "Select your competitors",
    subtitle: "Help us understand your market. You can skip this and add competitors later.",
    optional: true,
  },
  {
    id: "question",
    stepLabel: "Step 5",
    title: "Your top buyer question",
    subtitle:
      "A real question people ask ChatGPT, Perplexity, or Grok when they're ready to buy — we'll track if you're cited.",
  },
];

export const businessTypes = [
  { id: "saas", label: "B2B SaaS", icon: "🚀" },
  { id: "agency", label: "Agency", icon: "💼" },
  { id: "ecommerce", label: "Ecommerce", icon: "🛒" },
  { id: "local", label: "Local business", icon: "📍" },
  { id: "creator", label: "Creator / Media", icon: "✍️" },
  { id: "other", label: "Other", icon: "✨" },
];

export const referralSources = [
  { id: "google", label: "Google" },
  { id: "chatgpt", label: "ChatGPT" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "reddit", label: "Reddit" },
  { id: "friend", label: "Friend" },
  { id: "other", label: "Other" },
];
