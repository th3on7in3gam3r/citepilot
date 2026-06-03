import { geoPlaybook } from "@/lib/marketing/geo-playbook";
import { absoluteUrl } from "@/lib/schema/urls";
import { site } from "@/lib/site";

export function GeoPlaybookJsonLd() {
  const pageUrl = absoluteUrl(geoPlaybook.path);
  const logoUrl = absoluteUrl("/logo-mark.svg");

  const techArticle = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": `${pageUrl}#article`,
    headline: geoPlaybook.title,
    name: geoPlaybook.shortTitle,
    description: geoPlaybook.description,
    datePublished: geoPlaybook.datePublished,
    dateModified: geoPlaybook.dateModified,
    inLanguage: "en-US",
    author: {
      "@type": "Organization",
      name: site.name,
      url: site.url,
    },
    publisher: {
      "@type": "Organization",
      name: site.name,
      url: site.url,
      logo: {
        "@type": "ImageObject",
        url: logoUrl,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
    url: pageUrl,
    about: [
      { "@type": "Thing", name: "Generative Engine Optimization" },
      { "@type": "Thing", name: "Retrieval-Augmented Generation" },
      { "@type": "Thing", name: "AI search citations" },
    ],
    keywords: [
      "GEO",
      "generative engine optimization",
      "money prompts",
      "ChatGPT citations",
      "Perplexity SEO",
      "Google AI Overviews",
      "JSON-LD",
      "FAQPage schema",
    ],
  };

  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": pageUrl,
    url: pageUrl,
    name: geoPlaybook.shortTitle,
    description: geoPlaybook.description,
    isPartOf: {
      "@type": "WebSite",
      name: site.name,
      url: site.url,
    },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: logoUrl,
    },
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    mainEntity: geoPlaybook.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
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
        name: geoPlaybook.shortTitle,
        item: pageUrl,
      },
    ],
  };

  const graphs = [techArticle, webPage, faqPage, breadcrumb];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": graphs,
        }),
      }}
    />
  );
}
