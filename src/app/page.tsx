import { HomePage } from "@/components/home/HomePage";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default function Home() {
  return (
    <>
      <Header light overlay />
      <main>
        <HomePage />
      </main>
      <Footer />
    </>
  );
}
