import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MainContent } from "@/components/layout/MainContent";
import { ConsultingLanding } from "@/components/marketing/ConsultingLanding";
import { localeAlternates } from "@/lib/i18n/metadata";
import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

export const revalidate = 86400;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: clampSeoTitle(t("consultingTitle")),
    description: clampMetaDescription(t("consultingDescription")),
    alternates: localeAlternates("/consulting"),
  };
}

export default async function ConsultingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header light overlay />
      <MainContent className="bg-background">
        <ConsultingLanding />
      </MainContent>
      <Footer />
    </>
  );
}
