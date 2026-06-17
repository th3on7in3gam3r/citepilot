import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { AgencyLanding } from "@/components/marketing/AgencyLanding";
import { localeAlternates } from "@/lib/i18n/metadata";
import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: clampSeoTitle(t("agencyTitle")),
    description: clampMetaDescription(t("agencyDescription")),
    alternates: localeAlternates("/agency"),
  };
}

export default async function AgencyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

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
