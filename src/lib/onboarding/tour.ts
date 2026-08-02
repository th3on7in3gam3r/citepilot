import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

export const TOUR_COMPLETED_KEY = "citepilot_tour_completed";

export type ProductTourOptions = {
  workspaceLimitLabel: string;
  onComplete: () => void | Promise<void>;
};

function buildSteps(workspaceLimitLabel: string, onComplete: () => void | Promise<void>): DriveStep[] {
  return [
    {
      popover: {
        title: "Welcome to CitePilot 👋",
        description:
          "Let's take 60 seconds to show you how to see exactly where AI cites your brand. We'll guide you through your first citation check.",
        nextBtnText: "Let's go →",
        side: "over",
        align: "center",
      },
    },
    {
      element: "[data-tour='workspace']",
      popover: {
        title: "This is your workspace",
        description: `Each workspace tracks one domain. You can add up to ${workspaceLimitLabel} workspaces on your plan.`,
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "[data-tour='prompts']",
      popover: {
        title: "Add your money prompts",
        description:
          "These are the real questions your buyers ask AI. Example: \"best CRM for agencies under 50 seats\". Add 5–10 to start.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: "[data-tour='run-scan']",
      popover: {
        title: "Run your first scan",
        description:
          "We'll check ChatGPT, Perplexity, Gemini, and more to see if you're cited — results in about 60 seconds.",
        side: "bottom",
        align: "end",
      },
    },
    {
      element: "[data-tour='results']",
      popover: {
        title: "Your results appear here",
        description:
          "After your scan, you'll see exactly which platforms cite you per prompt — and your weekly action plan to improve.",
        side: "top",
        align: "center",
      },
    },
    {
      popover: {
        title: "You're all set",
        description: "Start by adding your first prompt, then run a scan.",
        nextBtnText: "Add my first prompt →",
        showButtons: ["next", "close"],
        side: "over",
        align: "center",
        onPopoverRender: (popover) => {
          popover.closeButton.textContent = "Skip tour";
        },
        onNextClick: (_element, _step, { driver: tourDriver }) => {
          void Promise.resolve(onComplete()).finally(() => {
            tourDriver.destroy();
            window.location.href =
              "/dashboard/content?section=targeting&tour=focus-prompt";
          });
        },
        onCloseClick: (_element, _step, { driver: tourDriver }) => {
          void Promise.resolve(onComplete()).finally(() => {
            tourDriver.destroy();
          });
        },
      },
    },
  ];
}

export function startProductTour(options: ProductTourOptions) {
  let completed = false;

  const markOnce = () => {
    if (completed) return;
    completed = true;
    void options.onComplete();
    if (typeof window !== "undefined") {
      localStorage.setItem(TOUR_COMPLETED_KEY, "1");
    }
  };

  const tourDriver = driver({
    showProgress: true,
    progressText: "{{current}} of {{total}}",
    popoverClass: "citepilot-tour-popover",
    overlayColor: "rgba(4, 6, 12, 0.55)",
    stagePadding: 10,
    stageRadius: 12,
    allowClose: true,
    smoothScroll: true,
    steps: buildSteps(options.workspaceLimitLabel, markOnce),
    onDestroyed: () => {
      markOnce();
    },
  });

  tourDriver.drive();
  return tourDriver;
}

export function clearTourCompletedLocal() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
  }
}
