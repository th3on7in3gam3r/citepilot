import { CitationDashboardMock } from "@/components/home/mockups/CitationDashboardMock";
import { ProductPreviewBadge } from "@/components/ui/ProductPreviewBadge";

const tabs = [
  { id: "live", label: "Live workspace", active: true },
  { id: "prompts", label: "Prompts", active: false },
  { id: "platforms", label: "Platforms", active: false },
  { id: "lift", label: "Lift report", active: false },
] as const;

const metrics = [
  {
    label: "Citation lift",
    value: "+24.8%",
    detail: "90-day trend",
    accent: true,
  },
  {
    label: "Citation score",
    value: "72",
    detail: "out of 100",
    accent: false,
  },
  {
    label: "Prompts cited",
    value: "3",
    detail: "of 12 tracked",
    accent: false,
  },
  {
    label: "AI engines",
    value: "4",
    detail: "monitored live",
    accent: false,
  },
] as const;

function LiftSparkline() {
  return (
    <svg
      viewBox="0 0 56 24"
      className="h-5 w-14 shrink-0"
      aria-hidden
    >
      <defs>
        <linearGradient id="hero-lift-spark" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
        <linearGradient id="hero-lift-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M2 20 L12 17 L22 14 L32 10 L42 6 L52 3 L54 3 L54 24 L2 24 Z"
        fill="url(#hero-lift-fill)"
      />
      <path
        d="M2 20 L12 17 L22 14 L32 10 L42 6 L52 3"
        fill="none"
        stroke="url(#hero-lift-spark)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HeroProductBanner() {
  return (
    <div className="hero-rise hero-rise-delay-3 relative mx-auto w-full max-w-4xl lg:max-w-[54rem]">
      <div className="hero-stage">
        <div className="hero-stage-inner relative">
          <div className="hero-stage-spotlight" aria-hidden />

          <div className="relative flex items-center justify-between gap-3 border-b border-white/[0.08] px-3 py-2.5 sm:px-5 sm:py-3">
            <div className="flex min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none] sm:gap-1.5 [&::-webkit-scrollbar]:hidden">
              {tabs.map((tab) => (
                <span
                  key={tab.id}
                  className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium transition sm:px-3 sm:text-xs ${
                    tab.active
                      ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                      : "text-white/40"
                  }`}
                >
                  {tab.active && (
                    <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-mint shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  )}
                  {tab.label}
                </span>
              ))}
            </div>
            <ProductPreviewBadge className="hidden shrink-0 sm:inline-flex" />
          </div>

          <div className="relative px-2.5 pb-2.5 pt-2 sm:px-4 sm:pb-4 sm:pt-3">
            <CitationDashboardMock embedded compact />
          </div>

          <div className="relative border-t border-white/[0.08] bg-[#080e18]/90 backdrop-blur-sm">
            <div className="grid grid-cols-2 sm:grid-cols-4">
              {metrics.map((m, i) => (
                <div
                  key={m.label}
                  className={`px-4 py-3.5 sm:px-5 sm:py-4 ${
                    i > 0 ? "border-white/[0.06] sm:border-l" : ""
                  } ${i % 2 === 1 ? "border-l border-white/[0.06] sm:border-l-white/[0.06]" : ""} ${i >= 2 ? "border-t border-white/[0.06] sm:border-t-0" : ""}`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                    {m.label}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <p
                      className={`font-display text-xl font-bold tracking-tight sm:text-2xl ${
                        m.accent
                          ? "bg-gradient-to-r from-[#6ee7b7] via-mint to-glow bg-clip-text text-transparent"
                          : "text-white"
                      }`}
                    >
                      {m.value}
                    </p>
                    {m.accent && <LiftSparkline />}
                  </div>
                  <p className="mt-0.5 text-[11px] text-white/45">{m.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-[11px] font-medium tracking-wide text-white/30 sm:text-xs">
        ChatGPT · Perplexity · Gemini · Grok · DeepSeek · Google AI Overviews
      </p>
    </div>
  );
}
