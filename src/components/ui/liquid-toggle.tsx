"use client";

import React from "react";
import { cn } from "@/lib/utils";

const styles = {
  switch: `relative block cursor-pointer h-8 w-[52px]
    [--c-active:#275EFE]
    [--c-success:#10B981]
    [--c-warning:#F59E0B]
    [--c-danger:#EF4444]
    [--c-active-inner:#FFFFFF]
    [--c-default:#D2D6E9]
    [--c-default-dark:#C7CBDF]
    [--c-black:#1B1B22]
    [transform:translateZ(0)]
    [-webkit-transform:translateZ(0)]
    [backface-visibility:hidden]
    [-webkit-backface-visibility:hidden]
    [perspective:1000]
    [-webkit-perspective:1000]`,
  input: `h-full w-full cursor-pointer appearance-none rounded-full
    bg-[--c-default] outline-none transition-colors duration-500
    hover:bg-[--c-default-dark]
    [transform:translate3d(0,0,0)]
    [-webkit-transform:translate3d(0,0,0)]
    data-[checked=true]:bg-[--c-background]`,
  svg: `pointer-events-none absolute inset-0 fill-white
    [transform:translate3d(0,0,0)]
    [-webkit-transform:translate3d(0,0,0)]`,
  circle: `transform-gpu transition-transform duration-500
    [transform:translate3d(0,0,0)]
    [-webkit-transform:translate3d(0,0,0)]
    [backface-visibility:hidden]
    [-webkit-backface-visibility:hidden]`,
  dropCircle: `transform-gpu transition-transform duration-700
    [transform:translate3d(0,0,0)]
    [-webkit-transform:translate3d(0,0,0)]`,
};

const variantStyles = {
  default: "[--c-background:var(--c-active)]",
  success: "[--c-background:var(--c-success)]",
  warning: "[--c-background:var(--c-warning)]",
  danger: "[--c-background:var(--c-danger)]",
};

export type LiquidToggleVariant = keyof typeof variantStyles;

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

  return (
    <label
      htmlFor={id}
      className={cn(
        styles.switch,
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
        data-checked={isChecked}
        aria-label={ariaLabel}
        className={cn(styles.input, variantStyles[variant])}
      />
      <svg viewBox="0 0 52 32" filter="url(#goo)" className={styles.svg} aria-hidden>
        <circle
          className={styles.circle}
          cx="16"
          cy="16"
          r="10"
          style={{
            transformOrigin: "16px 16px",
            transform: `translateX(${isChecked ? "12px" : "0px"}) scale(${isChecked ? "0" : "1"})`,
          }}
        />
        <circle
          className={styles.circle}
          cx="36"
          cy="16"
          r="10"
          style={{
            transformOrigin: "36px 16px",
            transform: `translateX(${isChecked ? "0px" : "-12px"}) scale(${isChecked ? "1" : "0"})`,
          }}
        />
        {isChecked && <circle className={styles.dropCircle} cx="35" cy="-1" r="2.5" />}
      </svg>
    </label>
  );
}

/** SVG filter for liquid toggle animation — mount once per page that uses LiquidToggle. */
export function GooeyFilter() {
  return (
    <svg className="fixed h-0 w-0" aria-hidden>
      <defs>
        <filter id="goo">
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

/** @deprecated Use LiquidToggle — alias for shadcn paste compatibility */
export const Toggle = LiquidToggle;
