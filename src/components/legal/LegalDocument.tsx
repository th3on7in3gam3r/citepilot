import { MainContent } from "@/components/layout/MainContent";
import { Container } from "@/components/ui/Container";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { contentPageMain } from "@/lib/marketing/surface-classes";
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
      <Header light overlay />
      <MainContent className={contentPageMain}>
        <Container className="py-16 md:py-20 lg:py-24">
          <article className="mx-auto max-w-3xl">
            <p className="marketing-eyebrow">Legal</p>
            <h1 className="content-page-title mt-4">{title}</h1>
            <p className="mt-2 text-sm text-muted">
              Last updated: {legalLastUpdated}
            </p>
            <p className="content-page-lead mt-6">{intro}</p>

            <div className="content-prose mt-12 space-y-10">
              {sections.map((section) => (
                <section key={section.title}>
                  <h2 className="marketing-section-title text-xl md:text-2xl">
                    {section.title}
                  </h2>
                  <div className="mt-3 space-y-3">
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

            <p className="content-prose mt-12 rounded-xl border border-border bg-card px-5 py-4 text-xs leading-relaxed">
              This document is provided for general information and is not legal
              advice. Consult qualified counsel for your jurisdiction before
              launch.
            </p>
          </article>
        </Container>
      </MainContent>
      <Footer />
    </>
  );
}
