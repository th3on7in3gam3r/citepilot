import { PressJsonLd } from "@/components/press/PressJsonLd";
import { PressPageContent } from "@/components/press/PressPageContent";
import { pressEmail } from "@/lib/press/content";
import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import { site } from "@/lib/site";
import type { Metadata } from "next";

const description = `Download CitePilot logos, screenshots, and brand assets. Press contact: ${pressEmail}`;

export const revalidate = 3600;

export const metadata: Metadata = {
  title: clampSeoTitle("Press & Media Kit"),
  description: clampMetaDescription(description),
  alternates: { canonical: `${site.url}/press` },
  openGraph: {
    title: "Press & Media Kit — CitePilot",
    description: clampMetaDescription(description),
    url: `${site.url}/press`,
    type: "website",
    images: [{ url: "/api/og/press-logo/full-dark", width: 800, height: 200 }],
  },
  robots: { index: true, follow: true },
};

export default function PressPage() {
  return (
    <>
      <PressJsonLd />
      <PressPageContent />
    </>
  );
}
