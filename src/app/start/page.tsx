import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { PhSignupTracker } from "@/components/launch/PhSignupTracker";
import { getSessionUserId } from "@/lib/auth/server";
import { FEATURE_FLAGS } from "@/lib/analytics/feature-flags";
import { getServerSideFlagVariant } from "@/lib/posthog-server";
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
  searchParams: Promise<{ full?: string; domain?: string; ph_signup?: string }>;
}) {
  const params = await searchParams;
  const userId = await getSessionUserId();
  let promptVariant = "control";
  try {
    promptVariant = userId
      ? await getServerSideFlagVariant(FEATURE_FLAGS.ONBOARDING_PROMPT_SUGGESTIONS, userId)
      : await getServerSideFlagVariant(FEATURE_FLAGS.ONBOARDING_PROMPT_SUGGESTIONS);
  } catch {
    promptVariant = "control";
  }

  if (userId && params.full !== "1") {
    try {
      const count = await countWorkspacesForUser(userId);
      if (count > 0) {
        redirect("/dashboard");
      }
    } catch {
      /* DB blip — still show onboarding rather than crash the post-login page */
    }
  }

  return (
    <>
      <PhSignupTracker enabled={params.ph_signup === "1"} />
      <OnboardingFlow
        initialDomain={params.domain}
        initialPromptVariant={promptVariant}
      />
    </>
  );
}
