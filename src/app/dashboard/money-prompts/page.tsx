import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import type { Metadata } from "next";
import { MoneyPromptsPageClient } from "./MoneyPromptsPageClient";

const title = "Money Prompts — buyer prompts & citation gaps";
const description =
  "Generate commercial-intent AI buyer prompts, check whether your brand is cited, and prioritize GEO citation gaps.";

export const metadata: Metadata = {
  title: clampSeoTitle(title),
  description: clampMetaDescription(description),
  robots: { index: false, follow: false },
};

export default function MoneyPromptsPage() {
  return <MoneyPromptsPageClient />;
}
