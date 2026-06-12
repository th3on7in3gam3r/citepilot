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
  variant = "light",
  showFaqs = false,
}: {
  variant?: "light" | "dark";
  showFaqs?: boolean;
}) {
  const dark = variant === "dark";

  return (
    <section
      className={
        dark
          ? "border-t border-white/[0.06] py-16 md:py-20"
          : "border-t border-border bg-white py-14 md:py-16"
      }
      aria-labelledby="product-transparency-heading"
    >
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p
            className={`text-sm font-semibold uppercase tracking-wider ${
              dark ? "text-glow" : "text-accent"
            }`}
          >
            {productTransparency.eyebrow}
          </p>
          <h2
            id="product-transparency-heading"
            className={`font-display mt-2 text-2xl font-bold md:text-3xl ${
              dark ? "text-white" : "text-ink"
            }`}
          >
            {productTransparency.title}
          </h2>
          <p
            className={`mt-3 text-sm md:text-base ${
              dark ? "text-white/55" : "text-muted"
            }`}
          >
            {productTransparency.intro}
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-6 lg:grid-cols-2">
          <div
            className={`rounded-2xl border p-6 md:p-8 ${
              dark
                ? "border-mint/25 bg-mint/5"
                : "border-mint/30 bg-mint/5"
            }`}
          >
            <h3
              className={`font-display text-lg font-bold ${
                dark ? "text-white" : "text-ink"
              }`}
            >
              What we do
            </h3>
            <ul className="mt-5 space-y-4">
              {productDoes.map((item) => (
                <li key={item.title}>
                  <p
                    className={`text-sm font-semibold ${
                      dark ? "text-white" : "text-ink"
                    }`}
                  >
                    {item.title}
                  </p>
                  <p
                    className={`mt-1 text-sm leading-relaxed ${
                      dark ? "text-white/60" : "text-muted"
                    }`}
                  >
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div
            className={`rounded-2xl border p-6 md:p-8 ${
              dark
                ? "border-white/10 bg-white/[0.04]"
                : "border-border bg-cream"
            }`}
          >
            <h3
              className={`font-display text-lg font-bold ${
                dark ? "text-white" : "text-ink"
              }`}
            >
              What we don&apos;t do
            </h3>
            <ul className="mt-5 space-y-4">
              {productDoesNot.map((item) => (
                <li key={item.title}>
                  <p
                    className={`text-sm font-semibold ${
                      dark ? "text-white" : "text-ink"
                    }`}
                  >
                    {item.title}
                  </p>
                  <p
                    className={`mt-1 text-sm leading-relaxed ${
                      dark ? "text-white/60" : "text-muted"
                    }`}
                  >
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p
          className={`mx-auto mt-8 max-w-3xl rounded-xl border px-4 py-3 text-center text-xs leading-relaxed md:text-sm ${
            dark
              ? "border-white/10 bg-black/20 text-white/50"
              : "border-border bg-cream text-muted"
          }`}
        >
          <span className="font-semibold text-inherit">Live vs estimated: </span>
          {liveVsInferredNote}
        </p>

        <p
          className={`mx-auto mt-4 max-w-2xl text-center text-xs ${
            dark ? "text-white/40" : "text-muted"
          }`}
        >
          Audit results are informational. See our{" "}
          <Link
            href="/terms"
            className={dark ? "text-glow underline" : "text-accent underline"}
          >
            Terms of Service
          </Link>{" "}
          for limitation of liability on rankings, citations, and revenue outcomes.
        </p>

        {showFaqs && (
          <dl className="mx-auto mt-10 max-w-3xl space-y-4">
            {transparencyFaqs.map((faq) => (
              <div
                key={faq.q}
                className={`rounded-2xl border p-5 ${
                  dark
                    ? "border-white/10 bg-white/[0.04]"
                    : "border-border bg-cream"
                }`}
              >
                <dt
                  className={`font-display font-bold ${
                    dark ? "text-white" : "text-ink"
                  }`}
                >
                  {faq.q}
                </dt>
                <dd
                  className={`mt-2 text-sm leading-relaxed ${
                    dark ? "text-white/60" : "text-muted"
                  }`}
                >
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
