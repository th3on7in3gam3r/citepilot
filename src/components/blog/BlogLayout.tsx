import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import type { ReactNode } from "react";

export function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header light overlay />
      <main id="main-content" tabIndex={-1} className="blog-surface min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  );
}
