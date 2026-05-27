export type GettingStartedStepId =
  | "workspace"
  | "audit"
  | "discussions"
  | "content"
  | "publish";

export type GettingStartedProgress = {
  dismissedAt?: string;
  visitedDiscussions?: boolean;
  publishedWebflow?: boolean;
  /** Any CMS publish (Webflow, WordPress, Ghost, Shopify, Framer) */
  publishedCms?: boolean;
};

export const GETTING_STARTED_STORAGE_KEY = "citepilot_getting_started";

export type GettingStartedStep = {
  id: GettingStartedStepId;
  title: string;
  description: string;
  href: string;
  optional?: boolean;
};

export const gettingStartedSteps: GettingStartedStep[] = [
  {
    id: "workspace",
    title: "Confirm your workspace",
    description: "Domain and buyer question are set in Settings.",
    href: "/dashboard/settings",
  },
  {
    id: "audit",
    title: "Run your GEO audit",
    description: "Baseline citation score and gap list for your domain.",
    href: "/dashboard/geo-audit",
  },
  {
    id: "discussions",
    title: "Find buyer-intent threads",
    description: "Hacker News, Stack Overflow, and web results for your prompt.",
    href: "/dashboard/discussions",
  },
  {
    id: "content",
    title: "Generate your first article",
    description: "Citation-ready draft from a gap or buyer question.",
    href: "/dashboard/content",
  },
  {
    id: "publish",
    title: "Publish to your CMS",
    description:
      "Push a draft to Webflow, WordPress, Ghost, Shopify, or Framer from the content queue.",
    href: "/dashboard/content",
    optional: true,
  },
];

export function readGettingStartedProgress(): GettingStartedProgress {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(GETTING_STARTED_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as GettingStartedProgress;
  } catch {
    return {};
  }
}

export function writeGettingStartedProgress(
  patch: Partial<GettingStartedProgress>,
): GettingStartedProgress {
  const next = { ...readGettingStartedProgress(), ...patch };
  localStorage.setItem(GETTING_STARTED_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function markGettingStartedStep(
  step: keyof Pick<
    GettingStartedProgress,
    "visitedDiscussions" | "publishedWebflow" | "publishedCms"
  >,
): void {
  if (step === "publishedWebflow") {
    writeGettingStartedProgress({ publishedWebflow: true, publishedCms: true });
    return;
  }
  writeGettingStartedProgress({ [step]: true });
}

export function dismissGettingStarted(): void {
  writeGettingStartedProgress({ dismissedAt: new Date().toISOString() });
}

export type StepCompletionInput = {
  hasDomain: boolean;
  hasBuyerQuestion: boolean;
  hasRealAudit: boolean;
  hasGeneratedPost: boolean;
  progress: GettingStartedProgress;
};

export function isStepComplete(
  id: GettingStartedStepId,
  input: StepCompletionInput,
): boolean {
  switch (id) {
    case "workspace":
      return input.hasDomain && input.hasBuyerQuestion;
    case "audit":
      return input.hasRealAudit;
    case "discussions":
      return Boolean(input.progress.visitedDiscussions);
    case "content":
      return input.hasGeneratedPost;
    case "publish":
      return Boolean(
        input.progress.publishedCms || input.progress.publishedWebflow,
      );
    default:
      return false;
  }
}

export function gettingStartedCompletion(input: StepCompletionInput): {
  completed: number;
  total: number;
  allDone: boolean;
} {
  const applicable = gettingStartedSteps;
  const completed = applicable.filter((s) => isStepComplete(s.id, input)).length;
  return {
    completed,
    total: applicable.length,
    allDone: completed === applicable.length,
  };
}
