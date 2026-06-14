import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { getSessionUserId } from "@/lib/auth/server";
import { countWorkspacesForUser } from "@/lib/server/workspace";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Start GEO & AI Citation Analysis",
  description:
    "Start your free GEO citation analysis in minutes. Add your domain, money prompts, and competitors — get audited on ChatGPT, Perplexity & AI Overviews.",
  alternates: { canonical: `${site.url}/start` },
};

export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ full?: string; domain?: string }>;
}) {
  const params = await searchParams;
  const userId = await getSessionUserId();

  if (userId && params.full !== "1") {
    const count = await countWorkspacesForUser(userId);
    if (count > 0) {
      redirect("/dashboard");
    }
  }

  return <OnboardingFlow initialDomain={params.domain} />;
}
