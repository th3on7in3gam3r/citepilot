import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import type { Metadata } from "next";

const geoAuditTitle = "Technical GEO Audit and Citation Gaps";
const geoAuditDescription =
  "Run technical GEO audits in CitePilot — schema, metadata, site signals, platform coverage, and citation gaps for ChatGPT, Perplexity, and AI Overviews on money prompts.";

export const metadata: Metadata = {
  title: clampSeoTitle(geoAuditTitle),
  description: clampMetaDescription(geoAuditDescription),
  robots: { index: true, follow: true },
};

export default function GeoAuditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
