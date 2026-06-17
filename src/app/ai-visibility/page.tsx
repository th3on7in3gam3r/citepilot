import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { AiVisibilityJsonLd } from "@/components/marketing/ai-visibility/AiVisibilityJsonLd";
import { AiVisibilityLanding } from "@/components/marketing/AiVisibilityLanding";
import { aiVisibilityLanding } from "@/lib/marketing/ai-visibility-landing";
import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import { site } from "@/lib/site";

const pageUrl = `${site.url.replace(/\/$/, "")}${aiVisibilityLanding.path}`;

export const metadata: Metadata = {
  title: clampSeoTitle(aiVisibilityLanding.shortTitle),
  description: clampMetaDescription(aiVisibilityLanding.description),
  alternates: { canonical: aiVisibilityLanding.path },
  openGraph: {
    title: aiVisibilityLanding.title,
    description: clampMetaDescription(aiVisibilityLanding.description),
    url: pageUrl,
    type: "website",
  },
  twitter: {
    title: aiVisibilityLanding.shortTitle,
    description: clampMetaDescription(aiVisibilityLanding.description),
  },
};

export default function AiVisibilityPage() {
  return (
    <>
      <AiVisibilityJsonLd />
      <Header />
      <main id="main-content" tabIndex={-1}>
        <AiVisibilityLanding />
      </main>
      <Footer />
    </>
  );
}
