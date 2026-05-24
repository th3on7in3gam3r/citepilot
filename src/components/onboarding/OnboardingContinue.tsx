export function OnboardingContinue({
  onClick,
  disabled,
  label = "Continue",
}: {
  onClick: () => void;
  disabled: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`mt-10 flex w-full items-center justify-center gap-2 rounded-full py-4 text-base font-semibold transition-all duration-300 md:py-[1.125rem] md:text-lg ${
        disabled
          ? "cursor-not-allowed border border-border bg-surface text-muted"
          : "bg-gradient-to-r from-[#7b93f0] via-[#6b8cff] to-accent text-white shadow-[0_8px_28px_rgba(107,140,255,0.35)] hover:brightness-[1.03] active:scale-[0.99]"
      }`}
    >
      {label}
      <span aria-hidden>→</span>
    </button>
  );
}
