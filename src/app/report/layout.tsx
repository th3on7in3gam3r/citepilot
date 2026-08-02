import type { ReactNode } from "react";

/** Minimal layout for printable / shareable reports — no app nav. */
export default function ReportLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-[100dvh] bg-cream">{children}</div>;
}
