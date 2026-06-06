import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import type { Metadata } from "next";

const discussionsTitle = "Buyer Discussion Radar for GEO";
const discussionsDescription =
  "Find buyer-intent threads on Hacker News, Stack Overflow, and the web for GEO research — map money prompts, spot competitors, and turn discussions into AI citations.";

export const metadata: Metadata = {
  title: clampSeoTitle(discussionsTitle),
  description: clampMetaDescription(discussionsDescription),
  robots: { index: true, follow: true },
};

export default function DiscussionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
