import { TOTAL_STEPS } from "@/lib/onboarding";

export function OnboardingStepProgress({ step }: { step: number }) {
  const fillPercent =
    TOTAL_STEPS <= 1 ? 100 : (step / (TOTAL_STEPS - 1)) * 100;

  return (
    <div className="mb-8" aria-label={`Step ${step + 1} of ${TOTAL_STEPS}`}>
      <div className="relative mx-1 flex items-center justify-between">
        <div
          className="absolute left-2 right-2 top-1/2 h-1 -translate-y-1/2 rounded-full bg-border"
          aria-hidden
        />
        <div
          className="absolute left-2 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-accent to-glow transition-[width] duration-500 ease-out"
          style={{ width: `calc((100% - 1rem) * ${fillPercent / 100})` }}
          aria-hidden
        />
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <div
              key={i}
              className={`relative z-10 rounded-full border-2 transition-all duration-300 ease-out ${
                done || current
                  ? "border-accent bg-accent shadow-[0_0_0_3px_rgba(14,165,233,0.15)]"
                  : "border-border bg-white"
              } ${current ? "h-3.5 w-3.5 scale-110" : "h-3 w-3"}`}
              aria-hidden
            />
          );
        })}
      </div>
      <p className="mt-3 text-center text-xs font-medium text-muted">
        Step {step + 1} of {TOTAL_STEPS}
      </p>
    </div>
  );
}
