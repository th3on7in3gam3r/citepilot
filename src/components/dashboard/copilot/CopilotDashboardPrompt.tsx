"use client";

import { useCopilot } from "@/components/dashboard/copilot/CopilotProvider";

export function CopilotDashboardPrompt() {
  const { widgets, openCopilot } = useCopilot();
  if (widgets.length > 0) return null;

  return (
    <button
      type="button"
      onClick={openCopilot}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-dashed border-[#0ea5e9]/40 bg-[#e0f2fe]/30 px-5 py-4 text-left transition hover:border-[#0ea5e9]/60 hover:bg-[#e0f2fe]/50"
    >
      <div>
        <p className="text-sm font-semibold text-[#0f172a]">
          Build your SEO cockpit with Copilot
        </p>
        <p className="mt-1 text-xs text-[#64748b]">
          Try: &quot;Generate a dashboard widget that shows Organic vs Paid Traffic as vertical bars.&quot;
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-[#0ea5e9] px-4 py-2 text-xs font-semibold text-white">
        ✦ Open Copilot
      </span>
    </button>
  );
}
