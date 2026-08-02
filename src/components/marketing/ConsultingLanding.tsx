"use client";

import {
  ConsultingInquiryForm,
  type ConsultingPackage,
} from "@/components/marketing/ConsultingInquiryForm";
import { MarketingDarkHero } from "@/components/marketing/MarketingDarkHero";
import { Container } from "@/components/ui/Container";
import { useTranslations } from "next-intl";
import { useState } from "react";

const OFFERS: {
  id: ConsultingPackage;
  titleKey: "offerStrategyTitle" | "offerRescueTitle" | "offerDeskTitle";
  priceKey: "offerStrategyPrice" | "offerRescuePrice" | "offerDeskPrice";
  bodyKey: "offerStrategyBody" | "offerRescueBody" | "offerDeskBody";
  impactKey: "offerStrategyImpact" | "offerRescueImpact" | "offerDeskImpact";
}[] = [
  {
    id: "strategy-session",
    titleKey: "offerStrategyTitle",
    priceKey: "offerStrategyPrice",
    bodyKey: "offerStrategyBody",
    impactKey: "offerStrategyImpact",
  },
  {
    id: "citation-rescue",
    titleKey: "offerRescueTitle",
    priceKey: "offerRescuePrice",
    bodyKey: "offerRescueBody",
    impactKey: "offerRescueImpact",
  },
  {
    id: "agency-desk",
    titleKey: "offerDeskTitle",
    priceKey: "offerDeskPrice",
    bodyKey: "offerDeskBody",
    impactKey: "offerDeskImpact",
  },
];

export function ConsultingLanding() {
  const t = useTranslations("consulting");
  const [selectedPackage, setSelectedPackage] =
    useState<ConsultingPackage>("other");

  return (
    <>
      <MarketingDarkHero
        eyebrow={t("heroEyebrow")}
        title={t("heroTitle")}
        description={t("heroDescription")}
      />

      <Container className="py-12 md:py-16 lg:py-20">
        <section aria-labelledby="consulting-offers">
          <h2
            id="consulting-offers"
            className="marketing-section-title text-center"
          >
            {t("offersTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-muted dark:text-white/55 md:text-base">
            {t("offersSub")}
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-center text-xs leading-relaxed text-muted dark:text-white/40">
            <span className="font-semibold text-accent dark:text-glow">
              {t("aiEstimateLabel")}
            </span>
            {" — "}
            {t("aiEstimateDisclaimer")}
          </p>

          <div className="mt-8 grid gap-4 md:mt-10 md:grid-cols-3 md:gap-5">
            {OFFERS.map((offer) => (
              <article
                key={offer.id}
                className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent dark:text-glow">
                  {t(offer.priceKey)}
                </p>
                <h3 className="mt-2 font-display text-lg font-bold text-foreground dark:text-white">
                  {t(offer.titleKey)}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted dark:text-white/55">
                  {t(offer.bodyKey)}
                </p>
                <p className="mt-4 text-xs leading-relaxed text-muted dark:text-white/40">
                  <span className="font-semibold">{t("aiEstimateLabel")}: </span>
                  {t(offer.impactKey)}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPackage(offer.id);
                    document
                      .getElementById("consulting-inquiry")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-foreground/85 transition hover:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:border-white/15 dark:text-white/85"
                >
                  {t("selectOffer")}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section
          id="consulting-inquiry"
          className="marketing-section-gap mx-auto max-w-xl scroll-mt-24"
          aria-labelledby="consulting-form-title"
        >
          <h2
            id="consulting-form-title"
            className="marketing-section-title text-center"
          >
            {t("formTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm leading-relaxed text-muted dark:text-white/55">
            {t("formSub")}
          </p>
          <div className="mt-6 md:mt-7">
            <ConsultingInquiryForm initialPackage={selectedPackage} />
          </div>
        </section>
      </Container>
    </>
  );
}
