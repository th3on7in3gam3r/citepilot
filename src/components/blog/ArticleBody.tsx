import type { BlogPost } from "@/lib/blog/types";

export function ArticleBody({ post }: { post: BlogPost }) {
  return (
    <article className="prose-citepilot mx-auto max-w-3xl">
      <p className="rounded-xl border border-accent/30 bg-accent/5 px-5 py-4 text-sm leading-relaxed text-ink">
        <strong className="text-accent">TL;DR — </strong>
        {post.tldr}
      </p>

      {post.sections.map((section, i) => {
        switch (section.type) {
          case "h2":
            return (
              <h2 key={i} className="font-display mt-10 text-2xl font-bold text-ink">
                {section.text}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} className="font-display mt-6 text-lg font-bold text-ink">
                {section.text}
              </h3>
            );
          case "p":
            return (
              <p key={i} className="mt-4 text-base leading-relaxed text-muted">
                {section.text}
              </p>
            );
          case "ul":
            return (
              <ul key={i} className="mt-4 list-disc space-y-2 pl-6 text-muted">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          case "callout":
            return (
              <blockquote
                key={i}
                className="mt-6 border-l-4 border-accent pl-4 text-sm font-medium text-ink"
              >
                {section.text}
              </blockquote>
            );
          default:
            return null;
        }
      })}

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold text-ink">FAQ</h2>
        <dl className="mt-4 space-y-4">
          {post.faqs.map((faq) => (
            <div key={faq.q} className="rounded-xl border border-border bg-surface px-5 py-4">
              <dt className="font-semibold text-ink">{faq.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12 rounded-2xl border border-border bg-ink p-6 text-white">
        <h2 className="font-display text-xl font-bold">Key takeaways</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-white/90">
          {post.takeaways.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}
