"use client";

import { useEffect } from "react";

export function ReportThemeStyles({ primaryColor }: { primaryColor: string }) {
  useEffect(() => {
    document.documentElement.style.setProperty("--wl-primary", primaryColor);
    return () => {
      document.documentElement.style.removeProperty("--wl-primary");
    };
  }, [primaryColor]);

  return (
    <style jsx global>{`
      :root {
        --wl-primary: ${primaryColor};
      }
      .wl-accent-border {
        border-color: color-mix(in srgb, var(--wl-primary) 35%, transparent);
      }
      .wl-accent-text {
        color: var(--wl-primary);
      }
      .wl-accent-bg {
        background-color: color-mix(in srgb, var(--wl-primary) 12%, white);
      }
      .wl-accent-check {
        color: var(--wl-primary);
      }
      .wl-cta {
        background-color: var(--wl-primary);
        color: white;
      }
      .wl-cta:hover {
        filter: brightness(0.95);
      }
    `}</style>
  );
}
