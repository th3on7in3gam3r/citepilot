import { HomePage } from "@/components/home/HomePage";
import { CancelledBanner } from "@/components/feedback/CancelledBanner";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SiteJsonLd } from "@/components/marketing/SiteJsonLd";
import { Suspense } from "react";

export default function Home() {
  return (
    <>
      <SiteJsonLd />
      <Suspense fallback={null}>
        <CancelledBanner />
      </Suspense>
      <Header light overlay />
      <main>
        <HomePage />
      </main>
      <Footer />
    </>
  );
}
