import { Container } from "@/components/ui/Container";
import { type ReactNode } from "react";

type SectionProps = {
  children: ReactNode;
  id?: string;
  className?: string;
  /** Tighter vertical padding for scroll-driven sections */
  compact?: boolean;
  containerClassName?: string;
};

export function Section({
  children,
  id,
  className = "",
  compact = false,
  containerClassName = "",
}: SectionProps) {
  const pad = compact
    ? "py-14 md:py-18"
    : "py-20 md:py-28 lg:py-32";

  return (
    <section id={id} className={`${pad} ${className}`}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}
