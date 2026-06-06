import {
  chatgptPromptsFaqs,
  chatgptPromptsLanding,
} from "@/lib/marketing/chatgpt-prompts-landing";
import { absoluteUrl } from "@/lib/schema/urls";
import { site } from "@/lib/site";

export function ChatGptPromptsJsonLd() {
  const pageUrl = absoluteUrl(chatgptPromptsLanding.path);

  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": pageUrl,
    url: pageUrl,
    name: chatgptPromptsLanding.title,
    description: chatgptPromptsLanding.description,
    isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
    about: { "@type": "Thing", name: "ChatGPT citation tracking" },
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: chatgptPromptsFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  const howTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How CitePilot identifies and optimizes ChatGPT money prompts",
    description: chatgptPromptsLanding.description,
    step: [
      "Discover prompt candidates from buyer questions and programmatic templates",
      "Baseline ChatGPT citation state with live probes",
      "Prioritize citation gaps with GEO audit signals",
      "Ship prompt-specific content and schema fixes",
      "Prove citation lift with weekly rescans and proof reports",
    ].map((text, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: text,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [webPage, faqPage, howTo],
        }),
      }}
    />
  );
}
