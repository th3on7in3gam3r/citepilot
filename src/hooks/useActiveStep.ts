"use client";

import { useEffect, useState, type RefObject } from "react";

export function useActiveStep(
  containerRef: RefObject<HTMLElement | null>,
  stepCount: number,
) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const panels = Array.from(
      container.querySelectorAll<HTMLElement>("[data-step-panel]"),
    );
    if (!panels.length) return;

    const updateActive = () => {
      const anchor = window.innerHeight * 0.42;
      let bestIndex = 0;
      let bestDistance = Infinity;

      panels.forEach((panel) => {
        const rect = panel.getBoundingClientRect();
        const panelCenter = rect.top + rect.height / 2;
        const distance = Math.abs(panelCenter - anchor);
        const index = Number(panel.dataset.stepIndex);

        if (!Number.isNaN(index) && distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      });

      setActive(bestIndex);
    };

    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);
    return () => {
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, [containerRef, stepCount]);

  return active;
}
