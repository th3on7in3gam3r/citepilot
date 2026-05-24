import { Container } from "@/components/ui/Container";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { legalLastUpdated, type LegalSection } from "@/lib/legal";

export function LegalDocument({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <Header />
      <main className="bg-cream pt-16 md:pt-[4.5rem]">
        <Container className="py-16 md:py-20 lg:py-24">
          <article className="mx-auto max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-accent">
              Legal
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold text-ink md:text-4xl">
              {title}
            </h1>
            <p className="mt-2 text-sm text-muted">Last updated: {legalLastUpdated}</p>
            <p className="mt-6 text-base leading-relaxed text-muted">{intro}</p>

            <div className="mt-12 space-y-10">
              {sections.map((section) => (
                <section key={section.title}>
                  <h2 className="font-display text-xl font-bold text-ink">
                    {section.title}
                  </h2>
                  <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted md:text-base">
                    {section.paragraphs.map((p) => (
                      <p key={p.slice(0, 48)}>{p}</p>
                    ))}
                    {section.bullets && (
                      <ul className="list-disc space-y-2 pl-5">
                        {section.bullets.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              ))}
            </div>

            <p className="mt-12 rounded-xl border border-border bg-white px-5 py-4 text-xs leading-relaxed text-muted">
              This document is provided for general information and is not legal
              advice. Consult qualified counsel for your jurisdiction before
              launch.
            </p>
          </article>
        </Container>
      </main>
      <Footer />
    </>
  );
}
