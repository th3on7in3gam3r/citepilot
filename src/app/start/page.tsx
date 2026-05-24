import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { getSessionUserId } from "@/lib/auth/server";
import { countWorkspacesForUser } from "@/lib/server/workspace";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Start Analysis",
  description:
    "Set up your CitePilot citation analysis in a few quick steps.",
};

export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ full?: string }>;
}) {
  const params = await searchParams;
  const userId = await getSessionUserId();

  if (userId && params.full !== "1") {
    const count = await countWorkspacesForUser(userId);
    if (count > 0) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="min-h-[100dvh] bg-cream">
      <OnboardingFlow />
    </div>
  );
}
