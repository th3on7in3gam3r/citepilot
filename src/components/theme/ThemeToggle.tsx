"use client";

import { useTheme } from "@/components/theme/ThemeProvider";
import type { ThemePreference } from "@/lib/theme";

function SunIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function nextPreference(current: ThemePreference): ThemePreference {
  if (current === "system") return "light";
  if (current === "light") return "dark";
  return "system";
}

function themeLabel(preference: ThemePreference, resolved: "light" | "dark"): string {
  if (preference === "system") {
    return `Theme: system (${resolved})`;
  }
  return `Theme: ${preference}`;
}

export function ThemeToggle({
  className = "",
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  const { preference, resolved, setPreference } = useTheme();
  const isDark = resolved === "dark";

  const buttonClass = onDark
    ? "border-white/20 text-white hover:bg-white/10 focus-visible:ring-white/40"
    : "border-border text-muted hover:bg-surface hover:text-ink focus-visible:ring-accent/40 dark:border-[#333] dark:text-[#94a3b8] dark:hover:bg-white/5 dark:hover:text-white";

  return (
    <button
      type="button"
      onClick={() => setPreference(nextPreference(preference))}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition focus:outline-none focus-visible:ring-2 ${buttonClass} ${className}`}
      aria-label={themeLabel(preference, resolved)}
      title={themeLabel(preference, resolved)}
    >
      {isDark ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}
