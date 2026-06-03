"use client";

import React from "react";
import { cn } from "@/lib/utils";

const GOO_FILTER_ID = "citepilot-liquid-goo";

const variantActiveBg: Record<
  "default" | "success" | "warning" | "danger",
  string
> = {
  default: "#6b8cff",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
};

export type LiquidToggleVariant = keyof typeof variantActiveBg;

export interface LiquidToggleProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  variant?: LiquidToggleVariant;
  id?: string;
  "aria-label"?: string;
  disabled?: boolean;
}

export function LiquidToggle({
  checked = false,
  onCheckedChange,
  className,
  variant = "default",
  id,
  "aria-label": ariaLabel,
  disabled = false,
}: LiquidToggleProps) {
  const [isChecked, setIsChecked] = React.useState(checked);

  React.useEffect(() => {
    setIsChecked(checked);
  }, [checked]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const next = e.target.checked;
    setIsChecked(next);
    onCheckedChange?.(next);
  };

  const activeColor = variantActiveBg[variant];

  return (
    <label
      htmlFor={id}
      className={cn(
        "relative block h-9 w-[3.25rem] shrink-0 cursor-pointer",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={isChecked}
        disabled={disabled}
        onChange={handleChange}
        aria-label={ariaLabel}
        className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-full outline-none transition-colors duration-300"
        style={{
          backgroundColor: isChecked ? activeColor : "#d2d6e9",
        }}
      />
      <svg
        viewBox="0 0 52 32"
        filter={`url(#${GOO_FILTER_ID})`}
        className="pointer-events-none absolute inset-0 h-full w-full fill-white drop-shadow-sm"
        aria-hidden
      >
        <circle
          className="transform-gpu transition-transform duration-500"
          cx="16"
          cy="16"
          r="10"
          fill="#ffffff"
          style={{
            transformOrigin: "16px 16px",
            transform: `translateX(${isChecked ? "12px" : "0px"}) scale(${isChecked ? "0" : "1"})`,
          }}
        />
        <circle
          className="transform-gpu transition-transform duration-500"
          cx="36"
          cy="16"
          r="10"
          fill="#ffffff"
          style={{
            transformOrigin: "36px 16px",
            transform: `translateX(${isChecked ? "0px" : "-12px"}) scale(${isChecked ? "1" : "0"})`,
          }}
        />
        {isChecked && (
          <circle
            className="transform-gpu transition-transform duration-700"
            cx="35"
            cy="-1"
            r="2.5"
            fill="#ffffff"
          />
        )}
      </svg>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-black/10 peer-focus-visible:ring-2 peer-focus-visible:ring-accent"
      />
    </label>
  );
}

/** SVG filter for liquid toggle — mount once per page that uses LiquidToggle. */
export function GooeyFilter() {
  return (
    <svg
      width="0"
      height="0"
      className="pointer-events-none absolute"
      aria-hidden
    >
      <defs>
        <filter id={GOO_FILTER_ID}>
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
}

/** @deprecated Use LiquidToggle */
export const Toggle = LiquidToggle;
