import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import type { ReactNode } from "react";

export function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header light overlay darkHero />
      <main id="main-content" tabIndex={-1} className="blog-surface">
        {children}
      </main>
      <Footer />
    </>
  );
}
