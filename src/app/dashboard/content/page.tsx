import { ContentSeoIntro } from "@/components/dashboard/ContentSeoIntro";
import type { Metadata } from "next";
import { ContentPageClient } from "./ContentPageClient";

export const metadata: Metadata = {
  title: "GEO Content Strategy & Publishing",
  description:
    "Plan GEO content from citation gaps — generate branded SEO articles, 30-day calendars, and publish to Webflow, WordPress, Ghost, Shopify, or Framer.",
};

export default function ContentPage() {
  return (
    <>
      <ContentPageClient />
      <ContentSeoIntro />
    </>
  );
}
