import {
  agencyFaqs,
  agencyLanding,
  agencyPricing,
} from "@/lib/marketing/agency-landing";
import { absoluteUrl } from "@/lib/schema/urls";
import { site } from "@/lib/site";

export function AgencyJsonLd() {
  const homeUrl = absoluteUrl();
  const pageUrl = absoluteUrl(agencyLanding.path);
  const fleetPrice = agencyPricing.price.replace(/[$,]/g, "");

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
              name: agencyLanding.title,
              description: agencyLanding.description,
              isPartOf: { "@id": `${homeUrl}#website` },
              about: { "@id": `${pageUrl}#service` },
            },
            {
              "@type": "Service",
              "@id": `${pageUrl}#service`,
              name: agencyLanding.shortTitle,
              description: agencyLanding.description,
              serviceType: "Generative Engine Optimization",
              provider: { "@id": `${homeUrl}#organization` },
              url: pageUrl,
              areaServed: "Worldwide",
              offers: {
                "@type": "Offer",
                "@id": `${pageUrl}#offer-fleet`,
                name: "Fleet",
                description: agencyPricing.tagline,
                price: fleetPrice,
                priceCurrency: "USD",
                url: absoluteUrl(agencyPricing.href),
                priceSpecification: {
                  "@type": "UnitPriceSpecification",
                  price: fleetPrice,
                  priceCurrency: "USD",
                  unitText: "MONTH",
                },
              },
            },
            {
              "@type": "FAQPage",
              "@id": `${pageUrl}#faq`,
              mainEntity: agencyFaqs.map((faq) => ({
                "@type": "Question",
                name: faq.q,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.a,
                },
              })),
            },
          ],
        }),
      }}
    />
  );
}
