import type { Metadata } from "next";
import { FeatureRequestBoard } from "@/components/feedback/FeatureRequestBoard";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Feature requests & roadmap",
  description:
    "Suggest features, upvote ideas, and see what CitePilot is building next.",
};

export default function FeedbackPage() {
  return (
    <>
      <Header />
      <main id="main-content" tabIndex={-1} className="bg-cream pt-24 pb-16">
        <Container className="max-w-3xl">
          <header className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              Product feedback
            </p>
            <h1 className="font-display mt-2 text-3xl font-bold text-ink md:text-4xl">
              Feature requests & roadmap
            </h1>
            <p className="mt-3 text-muted">
              Vote on what we ship next. Pilot and Fleet customers help prioritize the
              backlog.
            </p>
          </header>
          <FeatureRequestBoard />
        </Container>
      </main>
      <Footer />
    </>
  );
}
