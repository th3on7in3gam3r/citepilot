import Link from "next/link";
import { type ReactNode } from "react";

type Variant = "gradient" | "light" | "outline";

const styles: Record<Variant, string> = {
  gradient:
    "bg-gradient-to-r from-[#7b93f0] via-[#6b8cff] to-accent text-white shadow-[0_8px_28px_rgba(107,140,255,0.4)] hover:shadow-[0_12px_36px_rgba(107,140,255,0.5)] hover:brightness-[1.03]",
  light:
    "bg-white text-ink shadow-lg hover:bg-cream",
  outline:
    "border-2 border-accent/40 bg-white/10 text-white hover:border-white/60 hover:bg-white/15",
};

export function PillButton({
  href,
  children,
  variant = "gradient",
  className = "",
  size = "lg",
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
  size?: "md" | "lg";
}) {
  const sizeClass =
    size === "lg"
      ? "h-14 px-10 text-base md:h-[3.75rem] md:px-12 md:text-lg"
      : "h-11 px-8 text-sm";

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-full font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${sizeClass} ${styles[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

export function PillButtonAction({
  children,
  onClick,
  disabled,
  type = "button",
  variant = "gradient",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  variant?: Variant;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-12 min-w-[140px] items-center justify-center rounded-full px-8 text-base font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 md:h-14 md:min-w-[160px] ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
