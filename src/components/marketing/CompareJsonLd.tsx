import { site } from "@/lib/site";
import type { Competitor } from "@/lib/data/competitors";

export function CompareJsonLd({ competitor }: { competitor: Competitor }) {
  const pageUrl = `${site.url.replace(/\/$/, "")}/compare/${competitor.slug}`;

  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `CitePilot vs ${competitor.name}: AI Citation Tracking Compared`,
    description: competitor.intro,
    url: pageUrl,
    isPartOf: {
      "@type": "WebSite",
      name: site.name,
      url: site.url,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: site.url,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Compare",
          item: `${site.url.replace(/\/$/, "")}/compare/${competitor.slug}`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: `vs ${competitor.name}`,
          item: pageUrl,
        },
      ],
    },
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: competitor.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPage) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
      />
    </>
  );
}
