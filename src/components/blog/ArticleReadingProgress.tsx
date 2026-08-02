"use client";

import { useEffect, useState } from "react";

/** Fixed reading progress bar below the site header. */
export function ArticleReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const content = document.getElementById("blog-article-content");
    if (!content) return;

    const update = () => {
      const rect = content.getBoundingClientRect();
      const contentTop = rect.top + window.scrollY;
      const contentHeight = content.offsetHeight;
      const viewport = window.innerHeight;
      const scrollable = Math.max(contentHeight - viewport * 0.4, 1);
      const scrolled = window.scrollY - contentTop + viewport * 0.15;
      const pct = Math.min(100, Math.max(0, (scrolled / scrollable) * 100));
      setProgress(pct);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed top-16 left-0 right-0 z-[60] h-0.5 bg-white/10 md:top-[4.5rem]"
      aria-hidden
    >
      <div
        className="h-full bg-gradient-to-r from-accent to-glow transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
