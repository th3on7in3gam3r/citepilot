import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MainContent } from "@/components/layout/MainContent";
import { Container } from "@/components/ui/Container";
import {
  contentHeroCard,
  contentPageMain,
  marketingPrimaryCta,
  marketingSecondaryCta,
} from "@/lib/marketing/surface-classes";
import Link from "next/link";
import type { ReactNode } from "react";

export type HelpPageAction = {
  href: string;
  label: string;
  primary?: boolean;
  external?: boolean;
};

export function HelpPageLayout({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description: ReactNode;
  actions?: HelpPageAction[];
  children: ReactNode;
}) {
  return (
    <>
      <Header light overlay />
      <MainContent className={contentPageMain}>
        <Container className="pb-16 pt-24 md:pb-20 md:pt-28">
          <section className={contentHeroCard}>
            <p className="marketing-eyebrow">{eyebrow}</p>
            <h1 className="content-page-title mt-4">{title}</h1>
            <div className="content-page-lead mt-4 max-w-3xl">{description}</div>
            {actions && actions.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-3">
                {actions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={
                      action.primary ? marketingPrimaryCta : marketingSecondaryCta
                    }
                    {...(action.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            )}
          </section>
          {children}
        </Container>
      </MainContent>
      <Footer />
    </>
  );
}
