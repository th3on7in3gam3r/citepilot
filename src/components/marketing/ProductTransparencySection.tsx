import Link from "next/link";
import { Container } from "@/components/ui/Container";
import {
  liveVsInferredNote,
  productDoes,
  productDoesNot,
  productTransparency,
  transparencyFaqs,
} from "@/lib/marketing/product-transparency";

export function ProductTransparencySection({
  /** Use on pages with a fixed dark canvas (e.g. /product) regardless of theme toggle. */
  onDarkCanvas = false,
  showFaqs = false,
}: {
  onDarkCanvas?: boolean;
  showFaqs?: boolean;
}) {
  const sectionClass = onDarkCanvas
    ? "border-t border-white/[0.06] py-16 md:py-20"
    : "border-t border-border bg-white py-14 dark:border-white/[0.06] dark:bg-background md:py-16";

  const eyebrowClass = onDarkCanvas
    ? "text-glow"
    : "text-accent dark:text-glow";

  const headingClass = onDarkCanvas
    ? "text-white"
    : "text-ink dark:text-white";

  const introClass = onDarkCanvas
    ? "text-white/55"
    : "text-muted dark:text-white/55";

  const cardDoClass = onDarkCanvas
    ? "border-mint/25 bg-mint/5"
    : "border-mint/30 bg-mint/5 dark:border-mint/25";

  const cardDontClass = onDarkCanvas
    ? "border-white/10 bg-white/[0.04]"
    : "border-border bg-cream dark:border-white/10 dark:bg-white/[0.04]";

  const titleClass = onDarkCanvas
    ? "text-white"
    : "text-ink dark:text-white";

  const bodyClass = onDarkCanvas
    ? "text-white/60"
    : "text-muted dark:text-white/60";

  const noteClass = onDarkCanvas
    ? "border-white/10 bg-black/20 text-white/50"
    : "border-border bg-cream text-muted dark:border-white/10 dark:bg-black/20 dark:text-white/50";

  const footerClass = onDarkCanvas
    ? "text-white/40"
    : "text-muted dark:text-white/40";

  const linkClass = onDarkCanvas
    ? "text-glow underline"
    : "text-accent underline dark:text-glow";

  const faqCardClass = onDarkCanvas
    ? "border-white/10 bg-white/[0.04]"
    : "border-border bg-cream dark:border-white/10 dark:bg-white/[0.04]";

  return (
    <section
      className={sectionClass}
      aria-labelledby="product-transparency-heading"
    >
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p
            className={`text-sm font-semibold uppercase tracking-wider ${eyebrowClass}`}
          >
            {productTransparency.eyebrow}
          </p>
          <h2
            id="product-transparency-heading"
            className={`font-display mt-2 text-2xl font-bold md:text-3xl ${headingClass}`}
          >
            {productTransparency.title}
          </h2>
          <p className={`mt-3 text-sm md:text-base ${introClass}`}>
            {productTransparency.intro}
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-6 lg:grid-cols-2">
          <div className={`rounded-2xl border p-6 md:p-8 ${cardDoClass}`}>
            <h3 className={`font-display text-lg font-bold ${titleClass}`}>
              What we do
            </h3>
            <ul className="mt-5 space-y-4">
              {productDoes.map((item) => (
                <li key={item.title}>
                  <p className={`text-sm font-semibold ${titleClass}`}>
                    {item.title}
                  </p>
                  <p className={`mt-1 text-sm leading-relaxed ${bodyClass}`}>
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className={`rounded-2xl border p-6 md:p-8 ${cardDontClass}`}>
            <h3 className={`font-display text-lg font-bold ${titleClass}`}>
              What we don&apos;t do
            </h3>
            <ul className="mt-5 space-y-4">
              {productDoesNot.map((item) => (
                <li key={item.title}>
                  <p className={`text-sm font-semibold ${titleClass}`}>
                    {item.title}
                  </p>
                  <p className={`mt-1 text-sm leading-relaxed ${bodyClass}`}>
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p
          className={`mx-auto mt-8 max-w-3xl rounded-xl border px-4 py-3 text-center text-xs leading-relaxed md:text-sm ${noteClass}`}
        >
          <span className="font-semibold text-inherit">Live vs estimated: </span>
          {liveVsInferredNote}
        </p>

        <p className={`mx-auto mt-4 max-w-2xl text-center text-xs ${footerClass}`}>
          Audit results are informational. See our{" "}
          <Link href="/terms" className={linkClass}>
            Terms of Service
          </Link>{" "}
          for limitation of liability on rankings, citations, and revenue outcomes.
        </p>

        {showFaqs && (
          <dl className="mx-auto mt-10 max-w-3xl space-y-4">
            {transparencyFaqs.map((faq) => (
              <div
                key={faq.q}
                className={`rounded-2xl border p-5 ${faqCardClass}`}
              >
                <dt className={`font-display font-bold ${titleClass}`}>
                  {faq.q}
                </dt>
                <dd className={`mt-2 text-sm leading-relaxed ${bodyClass}`}>
                  {faq.a}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </Container>
    </section>
  );
}
