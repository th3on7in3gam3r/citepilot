import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MainContent } from "@/components/layout/MainContent";
import { MarketingDarkHero } from "@/components/marketing/MarketingDarkHero";
import { Container } from "@/components/ui/Container";
import type { ReactNode } from "react";

export function ToolPageShell({
  eyebrow = "Free tool",
  title,
  description,
  children,
  jsonLd,
  heroChildren,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  jsonLd?: ReactNode;
  heroChildren?: ReactNode;
}) {
  return (
    <>
      {jsonLd}
      <Header light overlay />
      <MainContent className="bg-background">
        <MarketingDarkHero
          eyebrow={eyebrow}
          title={title}
          description={description}
        >
          {heroChildren}
        </MarketingDarkHero>
        <Container className="py-14 md:py-20">{children}</Container>
      </MainContent>
      <Footer />
    </>
  );
}
