import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { AgencyLanding } from "@/components/marketing/AgencyLanding";
import { agencyLanding } from "@/lib/marketing/agency-landing";
import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import { site } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: clampSeoTitle(agencyLanding.shortTitle),
  description: clampMetaDescription(agencyLanding.description),
  alternates: { canonical: `${site.url.replace(/\/$/, "")}${agencyLanding.path}` },
  openGraph: {
    title: agencyLanding.title,
    description: clampMetaDescription(agencyLanding.description),
    url: agencyLanding.path,
    type: "website",
  },
};

export default function AgencyPage() {
  return (
    <>
      <Header light overlay />
      <main id="main-content" tabIndex={-1} className="bg-[#04060c]">
        <AgencyLanding />
      </main>
      <Footer />
    </>
  );
}
