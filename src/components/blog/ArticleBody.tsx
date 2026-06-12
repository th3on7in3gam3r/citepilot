import type { BlogPost } from "@/lib/blog/types";

export function ArticleBody({
  post,
  dark = false,
}: {
  post: BlogPost;
  dark?: boolean;
}) {
  const ink = dark ? "text-white" : "text-ink";
  const muted = dark ? "text-white/65" : "text-muted";
  const surface = dark
    ? "border-white/10 bg-white/[0.04]"
    : "border-border bg-surface";
  const summaryBox = dark
    ? "border-accent/30 bg-accent/10 text-white/80"
    : "border-accent/30 bg-accent/5 text-ink";

  return (
    <article className="prose-citepilot mx-auto max-w-3xl">
      <p
        className={`rounded-xl border px-5 py-4 text-sm leading-relaxed ${summaryBox}`}
      >
        <strong className="text-accent">Quick Summary — </strong>
        {post.tldr}
      </p>

      {post.sections.map((section, i) => {
        switch (section.type) {
          case "h2":
            return (
              <h2
                key={i}
                className={`font-display mt-10 text-2xl font-bold ${ink}`}
              >
                {section.text}
              </h2>
            );
          case "h3":
            return (
              <h3
                key={i}
                className={`font-display mt-6 text-lg font-bold ${ink}`}
              >
                {section.text}
              </h3>
            );
          case "p":
            return (
              <p key={i} className={`mt-4 text-base leading-relaxed ${muted}`}>
                {section.text}
              </p>
            );
          case "ul":
            return (
              <ul key={i} className={`mt-4 list-disc space-y-2 pl-6 ${muted}`}>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          case "callout":
            return (
              <blockquote
                key={i}
                className={`mt-6 border-l-4 border-accent pl-4 text-sm font-medium ${ink}`}
              >
                {section.text}
              </blockquote>
            );
          default:
            return null;
        }
      })}

      {post.faqs.length > 0 && (
        <section className="mt-12">
          <h2 className={`font-display text-2xl font-bold ${ink}`}>FAQ</h2>
          <dl className="mt-4 space-y-4">
            {post.faqs.map((faq) => (
              <div
                key={faq.q}
                className={`rounded-xl border px-5 py-4 ${surface}`}
              >
                <dt className={`font-semibold ${ink}`}>{faq.q}</dt>
                <dd className={`mt-2 text-sm leading-relaxed ${muted}`}>
                  {faq.a}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {post.takeaways.length > 0 && (
        <section
          className={`mt-12 rounded-2xl border p-6 ${
            dark
              ? "border-white/10 bg-white/[0.06] text-white"
              : "border-border bg-ink text-white"
          }`}
        >
          <h2 className="font-display text-xl font-bold">Key takeaways</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-white/90">
            {post.takeaways.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
