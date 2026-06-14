import { site, siteLogoUrl } from "@/lib/site";
import type { BlogPost } from "@/lib/blog/types";
import { clampMetaDescription } from "@/lib/seo/meta";

export function ArticleJsonLd({ post }: { post: BlogPost }) {
  const url = `${site.url.replace(/\/$/, "")}/blog/${post.slug}`;
  const description = clampMetaDescription(post.description);
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description,
    datePublished: post.publishedAt,
    author: {
      "@type": "Person",
      name: post.author.name,
      ...(post.author.role ? { jobTitle: post.author.role } : {}),
    },
    publisher: {
      "@type": "Organization",
      name: site.name,
      logo: { "@type": "ImageObject", url: siteLogoUrl() },
    },
    mainEntityOfPage: url,
  };

  const hasFaq = post.faqs.length > 0;
  const faq = hasFaq
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: post.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      />
      {faq && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
        />
      )}
    </>
  );
}
