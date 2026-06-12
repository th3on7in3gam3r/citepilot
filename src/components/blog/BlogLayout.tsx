import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import type { ReactNode } from "react";

export function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header light overlay />
      <main className="bg-[#04060c]">{children}</main>
      <Footer />
    </>
  );
}
