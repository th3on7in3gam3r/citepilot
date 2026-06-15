"use client";

import { Panel } from "@/components/dashboard/DashboardUI";
import { useTheme } from "@/components/theme/ThemeProvider";
import type { ThemePreference } from "@/lib/theme";

const OPTIONS: { value: ThemePreference; label: string; description: string }[] = [
  {
    value: "system",
    label: "System",
    description: "Match your OS — dashboard defaults to dark when unset",
  },
  {
    value: "light",
    label: "Light",
    description: "Light backgrounds across marketing and dashboard",
  },
  {
    value: "dark",
    label: "Dark",
    description: "Dark backgrounds everywhere",
  },
];

export function ThemeSettingsPanel() {
  const { preference, setPreference } = useTheme();

  return (
    <Panel title="Appearance">
      <p className="mb-4 text-sm text-muted">
        Choose how CitePilot looks. Your choice applies to the marketing site and
        dashboard.
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        {OPTIONS.map((option) => {
          const active = preference === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setPreference(option.value)}
              className={`rounded-xl border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                active
                  ? "border-accent/50 bg-accent/10 ring-1 ring-accent/20"
                  : "border-border bg-surface hover:border-accent/30 dark:border-[#333] dark:bg-[#141414] dark:hover:border-accent/30"
              }`}
            >
              <p className="text-sm font-semibold text-ink">{option.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {option.description}
              </p>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
