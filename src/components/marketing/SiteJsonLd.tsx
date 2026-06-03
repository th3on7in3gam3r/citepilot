import { faq } from "@/lib/content";
import { absoluteUrl } from "@/lib/schema/urls";
import { site } from "@/lib/site";

export function SiteJsonLd() {
  const homeUrl = absoluteUrl();
  const logoUrl = absoluteUrl("/logo-mark.svg");

  const organization = {
    "@type": "Organization",
    "@id": `${homeUrl}#organization`,
    name: site.name,
    url: homeUrl,
    logo: {
      "@type": "ImageObject",
      url: logoUrl,
    },
    description: site.description,
    email: site.supportEmail,
    parentOrganization: {
      "@type": "Organization",
      name: site.studio.name,
      url: site.studio.url,
    },
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
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
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
