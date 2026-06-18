export function OnboardingContinue({
  onClick,
  disabled,
  label = "Continue",
  disabledHint,
}: {
  onClick: () => void;
  disabled: boolean;
  label?: string;
  disabledHint?: string;
}) {
  return (
    <div className="mt-10">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-describedby={disabled && disabledHint ? "onboarding-continue-hint" : undefined}
        className={`flex w-full touch-manipulation items-center justify-center gap-2 rounded-full py-4 text-base font-semibold transition-all duration-200 md:py-[1.125rem] md:text-lg ${
          disabled
            ? "cursor-not-allowed border border-border bg-surface text-muted"
            : "bg-accent text-white shadow-[0_4px_20px_rgba(14,165,233,0.35)] hover:bg-accent-deep hover:shadow-[0_4px_24px_rgba(14,165,233,0.45)] active:scale-[0.99]"
        }`}
      >
        {label}
        <span aria-hidden>→</span>
      </button>
      {disabled && disabledHint && (
        <p id="onboarding-continue-hint" role="status" className="mt-2 text-center text-sm text-muted">
          {disabledHint}
        </p>
      )}
    </div>
  );
}
