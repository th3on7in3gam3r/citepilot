"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Panel } from "@/components/dashboard/DashboardUI";

type DismissibleSeoIntroProps = {
  /** Stable key for localStorage — e.g. `geo-audit-header`. */
  id: string;
  className?: string;
  children: ReactNode;
};

export function DismissibleSeoIntro({
  id,
  className,
  children,
}: DismissibleSeoIntroProps) {
  const storageKey = `citepilot-seo-intro-hidden:${id}`;
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey) === "1") setHidden(true);
    } catch {
      // ignore storage errors
    }
  }, [storageKey]);

  function onHide() {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      // ignore storage errors
    }
    setHidden(true);
  }

  if (hidden) return null;

  return (
    <Panel className={className}>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={onHide}
          className="text-xs font-medium text-muted transition hover:text-ink"
        >
          Hide
        </button>
      </div>
      {children}
    </Panel>
  );
}
