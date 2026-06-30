import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import type { Metadata } from "next";
import { OptimizerPageClient } from "./OptimizerPageClient";

const title = "Site Optimizer — AI fixes for SEO, AEO, and LLM citations";
const description =
  "Pilot+ Site Optimizer generates copy-paste code and prompts from your GEO audit — robots.txt, schema, money prompts, and citation gaps.";

export const metadata: Metadata = {
  title: clampSeoTitle(title),
  description: clampMetaDescription(description),
  robots: { index: true, follow: true },
};

export default function OptimizerPage() {
  return <OptimizerPageClient />;
}
