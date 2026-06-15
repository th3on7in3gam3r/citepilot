export type GettingStartedStepId =
  | "audit"
  | "prompts"
  | "cms"
  | "alerts"
  | "share";

export type GettingStartedStep = {
  id: GettingStartedStepId;
  title: string;
  description: string;
  href: string;
};

export const gettingStartedSteps: GettingStartedStep[] = [
  {
    id: "audit",
    title: "Run your first citation audit",
    description: "Baseline where AI assistants mention your brand today.",
    href: "/dashboard/geo-audit",
  },
  {
    id: "prompts",
    title: "Add 5+ money prompts",
    description: "Track buyer questions that drive pipeline in ChatGPT and Perplexity.",
    href: "/dashboard/content?section=keywords",
  },
  {
    id: "cms",
    title: "Connect a CMS (Webflow, WordPress, etc.)",
    description: "Publish citation-ready content from your queue.",
    href: "/dashboard/content?section=cms",
  },
  {
    id: "alerts",
    title: "Set up email alerts",
    description: "Get notified when citations move or competitors gain share.",
    href: "/dashboard/settings#notifications",
  },
  {
    id: "share",
    title: "Share your first proof report",
    description: "Send a client-ready citation summary or white-label link.",
    href: "/report/proof",
  },
];

export type ChecklistCompletion = {
  audit: boolean;
  prompts: boolean;
  cms: boolean;
  alerts: boolean;
  share: boolean;
};

export function isStepComplete(
  id: GettingStartedStepId,
  completion: ChecklistCompletion,
): boolean {
  return completion[id];
}

export function gettingStartedCompletion(completion: ChecklistCompletion): {
  completed: number;
  total: number;
  allDone: boolean;
} {
  const completed = gettingStartedSteps.filter((s) =>
    isStepComplete(s.id, completion),
  ).length;
  return {
    completed,
    total: gettingStartedSteps.length,
    allDone: completed === gettingStartedSteps.length,
  };
}

/** Show checklist for first 14 days unless dismissed or all done. */
export function shouldShowChecklist(input: {
  startedAt: string;
  dismissedAt?: string | null;
  allDone: boolean;
}): boolean {
  if (input.dismissedAt || input.allDone) return false;
  const ageMs = Date.now() - new Date(input.startedAt).getTime();
  const maxAgeMs = 14 * 24 * 60 * 60 * 1000;
  return ageMs < maxAgeMs;
}
