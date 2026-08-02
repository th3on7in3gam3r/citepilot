import type { Metadata } from "next";
import { CancelSurveyForm } from "@/components/feedback/CancelSurveyForm";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";

export const metadata: Metadata = {
  title: "Before you go",
  description: "Tell us why you're cancelling your CitePilot subscription.",
  robots: { index: false, follow: false },
};

export default function CancelSurveyPage() {
  return (
    <div className="min-h-[100dvh] bg-cream">
      <header className="border-b border-border bg-white px-6 py-5">
        <Container className="flex max-w-xl items-center justify-between">
          <Logo />
        </Container>
      </header>
      <main id="main-content" tabIndex={-1} className="px-6 py-10">
        <Container className="max-w-xl">
          <h1 className="font-display text-2xl font-bold text-ink">Before you go</h1>
          <p className="mt-2 text-sm text-muted">
            Your feedback helps us improve CitePilot. This takes under a minute.
          </p>
          <div className="mt-8">
            <CancelSurveyForm />
          </div>
        </Container>
      </main>
    </div>
  );
}
