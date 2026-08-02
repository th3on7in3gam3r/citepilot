import { toolCanonicalUrl, type MarketingToolMeta } from "@/lib/marketing/tools-pages";
import { absoluteUrl } from "@/lib/schema/urls";
import { site } from "@/lib/site";

type Props = {
  tool: MarketingToolMeta;
};

export function ToolSoftwareApplicationJsonLd({ tool }: Props) {
  const pageUrl = toolCanonicalUrl(tool.path);
  const logoUrl = absoluteUrl("/logo-mark.svg");

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": `${pageUrl}#software`,
        name: tool.shortTitle,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        description: tool.description,
        url: pageUrl,
        provider: {
          "@type": "Organization",
          name: site.name,
          url: site.url,
        },
        image: logoUrl,
      },
      {
        "@type": "WebPage",
        "@id": pageUrl,
        url: pageUrl,
        name: tool.title,
        description: tool.description,
        isPartOf: {
          "@type": "WebSite",
          name: site.name,
          url: site.url,
        },
      },
      {
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
            name: "Free tools",
            item: toolCanonicalUrl("/tools/citation-checker"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: tool.shortTitle,
            item: pageUrl,
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
