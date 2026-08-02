import type { Metadata } from "next";
import {
  ChromeExtensionInstallJsonLd,
  ChromeExtensionPageContent,
} from "@/components/marketing/ChromeExtensionPage";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MarketingDarkHero } from "@/components/marketing/MarketingDarkHero";
import { Container } from "@/components/ui/Container";
import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import { site } from "@/lib/site";

export const revalidate = 3600;

const title = "CitePilot Chrome Extension — AI Citation Checker";
const description =
  "Free Chrome extension: see if any website is cited on ChatGPT and Perplexity while you browse. Green badge when AI search data exists.";

export const metadata: Metadata = {
  title: clampSeoTitle(title),
  description: clampMetaDescription(description),
  alternates: { canonical: "/chrome-extension" },
  openGraph: {
    title,
    description: clampMetaDescription(description),
    url: `${site.url}/chrome-extension`,
    type: "website",
  },
};

export default function ChromeExtensionPage() {
  return (
    <>
      <ChromeExtensionInstallJsonLd />
      <Header light overlay />
      <main id="main-content" tabIndex={-1} className="bg-[#04060c]">
        <MarketingDarkHero
          eyebrow="Free Chrome extension"
          title="See AI citations for any site you visit"
          description={description}
        />
        <Container className="py-14 md:py-20">
          <ChromeExtensionPageContent />
        </Container>
      </main>
      <Footer />
    </>
  );
}
