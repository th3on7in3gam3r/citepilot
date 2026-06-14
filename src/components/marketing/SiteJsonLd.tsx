import { faq } from "@/lib/content";
import { answerCapsuleBlocks } from "@/lib/marketing/answer-capsule";
import { absoluteUrl } from "@/lib/schema/urls";
import { site, siteLogoUrl, siteSocialProfiles } from "@/lib/site";

export function SiteJsonLd() {
  const homeUrl = absoluteUrl();

  const organization = {
    "@type": "Organization",
    "@id": `${homeUrl}#organization`,
    name: site.name,
    url: homeUrl,
    logo: {
      "@type": "ImageObject",
      url: siteLogoUrl(),
      width: 1200,
      height: 630,
    },
    description: site.description,
    email: site.supportEmail,
    foundingDate: site.foundingDate,
    sameAs: siteSocialProfiles(),
    knowsAbout: [...site.knowsAbout],
  };

  const webSite = {
    "@type": "WebSite",
    "@id": `${homeUrl}#website`,
    url: homeUrl,
    name: site.name,
    description: site.description,
    publisher: { "@id": `${homeUrl}#organization` },
    inLanguage: "en-US",
  };

  const faqPage = {
    "@type": "FAQPage",
    "@id": `${homeUrl}#faq`,
    mainEntity: [
      ...answerCapsuleBlocks.map((block) => ({
        "@type": "Question",
        "@id": `${homeUrl}#${block.id}`,
        name: block.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: block.answer,
        },
      })),
      ...faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [organization, webSite, faqPage],
        }),
      }}
    />
  );
}
