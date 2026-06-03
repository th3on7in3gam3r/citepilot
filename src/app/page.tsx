import { HomePage } from "@/components/home/HomePage";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SiteJsonLd } from "@/components/marketing/SiteJsonLd";

export default function Home() {
  return (
    <>
      <SiteJsonLd />
      <Header light overlay />
      <main>
        <HomePage />
      </main>
      <Footer />
    </>
  );
}
