import { absoluteUrl } from "@/lib/schema/urls";
import {
  pressEmail,
  pressJournalistFaqs,
  pressOneLiner,
  pressShortParagraph,
} from "@/lib/press/content";
import { site } from "@/lib/site";

export function PressJsonLd() {
  const pageUrl = absoluteUrl("/press");

  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": pageUrl,
    url: pageUrl,
    name: "Press & Media Kit — CitePilot",
    description:
      "Download CitePilot logos, screenshots, and brand assets. Press contact: press@getcitepilot.com",
    inLanguage: "en-US",
    isPartOf: {
      "@type": "WebSite",
      name: site.name,
      url: site.url,
    },
    about: {
      "@type": "Organization",
      name: site.name,
      url: site.url,
      email: pressEmail,
    },
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    mainEntity: pressJournalistFaqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
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
