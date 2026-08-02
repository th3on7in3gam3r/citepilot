import { pricingTiers } from "@/lib/content";
import { pricingPageFaqItems } from "@/lib/marketing/site-faq";
import { pricingTierOffers } from "@/lib/schema/pricing-offers";
import { absoluteUrl } from "@/lib/schema/urls";
import { site, siteLogoUrl } from "@/lib/site";

export function PricingJsonLd() {
  const homeUrl = absoluteUrl();
  const pageUrl = absoluteUrl("/pricing");
  const offers = pricingTierOffers(pageUrl);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              "@id": pageUrl,
              url: pageUrl,
              name: "GEO and AI citation monitoring pricing",
              description: site.description,
              isPartOf: { "@id": `${homeUrl}#website` },
              about: { "@id": `${pageUrl}#software` },
            },
            {
              "@type": "SoftwareApplication",
              "@id": `${pageUrl}#software`,
              name: site.name,
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description: site.description,
              url: pageUrl,
              image: siteLogoUrl(),
              provider: { "@id": `${homeUrl}#organization` },
              offers,
              featureList: pricingTiers.flatMap((tier) => tier.features).slice(0, 12),
            },
            {
              "@type": "FAQPage",
              "@id": `${pageUrl}#faq`,
              mainEntity: pricingPageFaqItems().map((item) => ({
                "@type": "Question",
                ...(item.id ? { "@id": `${pageUrl}#${item.id}` } : {}),
                name: item.q,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: item.a,
                },
              })),
            },
          ],
        }),
      }}
    />
  );
}
