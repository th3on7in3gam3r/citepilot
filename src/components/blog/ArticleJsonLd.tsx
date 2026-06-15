import { blogPostImageUrl } from "@/lib/blog/covers";
import type { BlogPost } from "@/lib/blog/types";
import { clampMetaDescription } from "@/lib/seo/meta";
import { site } from "@/lib/site";

const homeUrl = site.url.replace(/\/$/, "");

export function ArticleJsonLd({ post }: { post: BlogPost }) {
  const url = `${homeUrl}/blog/${post.slug}`;
  const description = clampMetaDescription(post.description);
  const image = blogPostImageUrl(post);

  const article = {
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
      "@id": `${homeUrl}#organization`,
    },
    image,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }}
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
