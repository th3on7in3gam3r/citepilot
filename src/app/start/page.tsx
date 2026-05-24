import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Start Analysis",
  description:
    "Set up your CitePilot citation analysis in a few quick steps.",
};

export default function StartPage() {
  return (
    <div className="min-h-[100dvh] bg-cream">
      <OnboardingFlow />
    </div>
  );
}
