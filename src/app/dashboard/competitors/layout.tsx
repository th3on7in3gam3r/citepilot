import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import type { Metadata } from "next";

const title = "Competitor Citation Intelligence";
const description =
  "Track competitor domains, compare AI citation rates prompt-by-prompt, discover new rivals on money prompts, and get GEO actions to steal their citations.";

export const metadata: Metadata = {
  title: clampSeoTitle(title),
  description: clampMetaDescription(description),
  robots: { index: true, follow: true },
};

export default function CompetitorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
