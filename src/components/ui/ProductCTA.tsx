import Link from "next/link";
import { type ReactNode } from "react";

export type ProductCTAVariant =
  | "primary"
  | "accent"
  | "outline"
  | "outline-light"
  | "dark";

const variants: Record<ProductCTAVariant, string> = {
  primary:
    "bg-ink text-white shadow-[0_8px_30px_rgba(7,11,20,0.2)] hover:shadow-[0_12px_40px_rgba(7,11,20,0.28)]",
  accent:
    "bg-gradient-to-r from-accent to-accent-deep text-white shadow-[0_8px_32px_rgba(14,165,233,0.35)] hover:shadow-[0_12px_40px_rgba(14,165,233,0.45)]",
  outline:
    "border-2 border-ink/10 bg-white text-ink hover:border-accent hover:text-accent-deep",
  "outline-light":
    "border-2 border-white/25 bg-white/5 text-white hover:border-white/50 hover:bg-white/10",
  dark: "bg-white text-ink shadow-lg hover:bg-cream",
};

function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function iconBgFor(variant: ProductCTAVariant) {
  if (variant === "outline") return "bg-ink text-white group-hover:bg-accent";
  if (variant === "outline-light")
    return "bg-white/15 text-white group-hover:bg-white/25";
  if (variant === "dark") return "bg-ink text-white";
  return "bg-white/20 text-white group-hover:bg-white/30";
}

function sublabelClass(variant: ProductCTAVariant) {
  if (variant === "outline") return "text-muted";
  if (
    variant === "outline-light" ||
    variant === "accent" ||
    variant === "primary"
  )
    return "text-white/70";
  return "text-muted";
}

function ProductCTAInner({
  children,
  variant,
  sublabel,
  showArrow,
  compact,
}: {
  children: ReactNode;
  variant: ProductCTAVariant;
  sublabel?: string;
  showArrow: boolean;
  compact?: boolean;
}) {
  return (
    <>
      <span className={`flex flex-col text-left ${compact ? "py-1 pr-1" : "py-2 pr-2"}`}>
        <span
          className={`font-semibold leading-tight ${
            compact ? "text-sm" : "text-sm md:text-base"
          }`}
        >
          {children}
        </span>
        {sublabel && !compact && (
          <span className={`text-[11px] font-medium ${sublabelClass(variant)}`}>
            {sublabel}
          </span>
        )}
      </span>
      {showArrow && (
        <span
          className={`flex shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${iconBgFor(variant)} ${
            compact ? "h-8 w-8" : "h-11 w-11"
          }`}
        >
          <ArrowIcon className={compact ? "h-3.5 w-3.5" : ""} />
        </span>
      )}
    </>
  );
}

const baseClass =
  "group inline-flex items-center gap-1 rounded-full transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60";

export function ProductCTA({
  href,
  children,
  variant = "accent",
  sublabel,
  className = "",
  showArrow = true,
  compact = false,
}: {
  href: string;
  children: ReactNode;
  variant?: ProductCTAVariant;
  sublabel?: string;
  className?: string;
  showArrow?: boolean;
  compact?: boolean;
}) {
  const padding = compact ? "p-1 pl-4" : "p-1.5 pl-6";

  return (
    <Link
      href={href}
      className={`${baseClass} ${padding} ${variants[variant]} ${compact ? "w-auto" : "w-full sm:w-auto"} ${className}`}
    >
      <ProductCTAInner
        variant={variant}
        sublabel={sublabel}
        showArrow={showArrow}
        compact={compact}
      >
        {children}
      </ProductCTAInner>
    </Link>
  );
}

export function ProductCTAButton({
  children,
  variant = "accent",
  sublabel,
  className = "",
  showArrow = true,
  disabled,
  type = "submit",
  compact = false,
}: {
  children: ReactNode;
  variant?: ProductCTAVariant;
  sublabel?: string;
  className?: string;
  showArrow?: boolean;
  disabled?: boolean;
  type?: "submit" | "button";
  compact?: boolean;
}) {
  const padding = compact ? "p-1 pl-4" : "p-1.5 pl-6";

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${baseClass} ${padding} w-full sm:w-auto ${variants[variant]} ${className}`}
    >
      <ProductCTAInner
        variant={variant}
        sublabel={sublabel}
        showArrow={showArrow && !disabled}
        compact={compact}
      >
        {children}
      </ProductCTAInner>
    </button>
  );
}
