import { CitationDashboardMock } from "@/components/home/mockups/CitationDashboardMock";
import { ProductPreviewBadge } from "@/components/ui/ProductPreviewBadge";

const tabs = [
  { id: "live", label: "Live workspace", active: true },
  { id: "prompts", label: "Prompts", active: false },
  { id: "platforms", label: "Platforms", active: false },
  { id: "lift", label: "Lift report", active: false },
] as const;

export function HeroProductBanner() {
  return (
    <div
      className="hero-rise hero-rise-delay-3 relative mx-auto w-full max-w-4xl lg:max-w-none lg:mx-0"
      role="img"
      aria-label="Product preview showing citation dashboard across AI platforms"
    >
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
        </div>
      </div>

      <p className="mt-3 text-center text-[11px] font-medium tracking-wide text-muted dark:text-white/50 sm:mt-3.5 sm:text-xs lg:text-left">
        ChatGPT · Perplexity · Gemini · Grok · DeepSeek · Google AI Overviews
      </p>
    </div>
  );
}
