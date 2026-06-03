import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { InteractiveArticle } from "@/components/marketing/InteractiveArticle";

export const metadata: Metadata = {
  title: "GEO Playbook",
  description:
    "How to secure citations in ChatGPT, Perplexity, and Google AI Overviews — the CitePilot generative engine optimization playbook.",
};

export default function NurturePage() {
  return (
    <>
      <Header />
      <main className="bg-cream pt-24">
        <InteractiveArticle />
      </main>
      <Footer />
    </>
  );
}
