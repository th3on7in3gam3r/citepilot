import type { ReactNode } from "react";

/**
 * SEO / orientation copy for crawlers and no-JS renders.
 * Hidden from the signed-in dashboard UI (see metadata on each route).
 */
export function DashboardCrawlContent({ children }: { children: ReactNode }) {
  return (
    <div className="hidden" aria-hidden="true">
      {children}
    </div>
  );
}
