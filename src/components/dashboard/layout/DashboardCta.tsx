import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";

type Size = "sm" | "md" | "lg";

function sizeClass(variant: "primary" | "secondary", size: Size): string {
  if (size === "md") return "";
  const prefix = variant === "primary" ? "btn-dash-primary" : "btn-dash-secondary";
  return `${prefix}--${size}`;
}

export function DashboardPrimaryCta({
  href,
  children,
  className = "",
  size = "md",
  ...props
}: ComponentProps<typeof Link> & { size?: Size }) {
  return (
    <Link
      href={href}
      className={`btn-dash-primary ${sizeClass("primary", size)} ${className}`.trim()}
      {...props}
    >
      {children}
    </Link>
  );
}

export function DashboardPrimaryCtaButton({
  children,
  className = "",
  size = "md",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { size?: Size }) {
  return (
    <button
      type={type}
      className={`btn-dash-primary ${sizeClass("primary", size)} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

export function DashboardSecondaryCta({
  href,
  children,
  className = "",
  size = "md",
  ...props
}: ComponentProps<typeof Link> & { size?: Size }) {
  return (
    <Link
      href={href}
      className={`btn-dash-secondary ${sizeClass("secondary", size)} ${className}`.trim()}
      {...props}
    >
      {children}
    </Link>
  );
}

export function DashboardSecondaryCtaButton({
  children,
  className = "",
  size = "md",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { size?: Size }) {
  return (
    <button
      type={type}
      className={`btn-dash-secondary ${sizeClass("secondary", size)} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
