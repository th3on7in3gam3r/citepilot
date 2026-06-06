import {
  aiVisibilityFaqs,
  aiVisibilityLanding,
} from "@/lib/marketing/ai-visibility-landing";
import { absoluteUrl } from "@/lib/schema/urls";
import { site } from "@/lib/site";

export function AiVisibilityJsonLd() {
  const pageUrl = absoluteUrl(aiVisibilityLanding.path);

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
              name: aiVisibilityLanding.title,
              description: aiVisibilityLanding.description,
              isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
            },
            {
              "@type": "Service",
              name: "CitePilot AI Visibility",
              provider: { "@type": "Organization", name: site.name, url: site.url },
              description: aiVisibilityLanding.description,
              serviceType: "Generative Engine Optimization",
            },
            {
              "@type": "FAQPage",
              mainEntity: aiVisibilityFaqs.map((faq) => ({
                "@type": "Question",
                name: faq.q,
                acceptedAnswer: { "@type": "Answer", text: faq.a },
              })),
            },
          ],
        }),
      }}
    />
  );
}
