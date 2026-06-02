import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { InteractiveArticle } from "@/components/marketing/InteractiveArticle";

export const metadata: Metadata = {
  title: "GEO Nurture Sequence",
  description:
    "Preview CitePilot's three-email nurture flow for B2B SaaS teams moving from SEO to generative engine optimization.",
};

type PageProps = {
  searchParams: Promise<{ name?: string }>;
};

export default async function NurturePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const firstName =
    typeof params.name === "string" && params.name.trim().length > 0
      ? params.name.trim()
      : undefined;

  return (
    <>
      <Header />
      <main className="bg-cream pt-24">
        <InteractiveArticle firstName={firstName} />
      </main>
      <Footer />
    </>
  );
}
