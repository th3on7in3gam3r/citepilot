import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import type { Metadata } from "next";

const contentTitle = "GEO Content Strategy and Publishing";
const contentDescription =
  "Plan GEO content from citation gaps in CitePilot — generate branded SEO articles, 30-day editorial calendars, CMS publishing to Webflow and WordPress, and measure citation lift.";

export const metadata: Metadata = {
  title: clampSeoTitle(contentTitle),
  description: clampMetaDescription(contentDescription),
};

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
