import type { Metadata } from "next";
import { LaunchPageContent } from "@/components/launch/LaunchPageContent";
import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import { site } from "@/lib/site";

export const revalidate = 60;

export const metadata: Metadata = {
  title: clampSeoTitle("Product Hunt Launch — CitePilot"),
  description: clampMetaDescription(
    "Finally know if ChatGPT cites your brand. Free citation audit in 60 seconds. Product Hunt exclusive: 30% off Pilot.",
  ),
  robots: { index: true, follow: true },
  openGraph: {
    title: "CitePilot — Know if ChatGPT cites your brand",
    description: "Track citations across 6 AI platforms. Product Hunt exclusive offer inside.",
    url: `${site.url}/launch`,
    type: "website",
    images: [{ url: "/api/og/ph-gallery/1", width: 1270, height: 760 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CitePilot — Product Hunt launch",
    images: ["/api/og/ph-gallery/1"],
  },
};

export default function LaunchPage() {
  return <LaunchPageContent />;
}
