"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    Pulse?: { track: (event: string) => void };
  }
}

function PulseSpaPageviewsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    window.Pulse?.track("pageview");
  }, [pathname, searchParams]);

  return null;
}

/** Fires Pulse pageviews on App Router client navigations (initial load is from pulse.js). */
export function PulseSpaPageviews() {
  return (
    <Suspense fallback={null}>
      <PulseSpaPageviewsInner />
    </Suspense>
  );
}
