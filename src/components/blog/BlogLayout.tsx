import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import type { ReactNode } from "react";

export function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header overlay darkHero />
      <main id="main-content" tabIndex={-1} className="bg-[#04060c]">{children}</main>
      <Footer />
    </>
  );
}
