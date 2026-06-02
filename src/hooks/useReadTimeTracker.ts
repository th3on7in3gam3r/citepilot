"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type RefObject,
} from "react";

const DEFAULT_WPM = 238;

export type ReadTimeTrackerState = {
  minutes: number;
  progress: number;
  percentRead: number;
  minutesLeft: number;
  activeSectionId: string | null;
  activeSectionLabel: string | null;
};

type SectionMeta = { id: string; label: string };

type Options = {
  wordsPerMinute?: number;
  sections?: SectionMeta[];
  useWindowScroll?: boolean;
};

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function useReadTimeTracker(
  articleRef: RefObject<HTMLElement | null>,
  wordCount?: number,
  options: Options = {},
): ReadTimeTrackerState {
  const wpm = options.wordsPerMinute ?? DEFAULT_WPM;
  const sections = useMemo(
    () => options.sections ?? [],
    [options.sections],
  );
  const useWindowScroll = options.useWindowScroll ?? true;

  const [progress, setProgress] = useState(0);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    sections[0]?.id ?? null,
  );

  const minutes = useMemo(
    () => Math.max(1, Math.ceil((wordCount ?? 0) / wpm)),
    [wordCount, wpm],
  );

  const updateScrollProgress = useCallback(() => {
    const el = articleRef.current;
    if (!el) return;

    if (useWindowScroll) {
      const rect = el.getBoundingClientRect();
      const viewport = window.innerHeight;
      const scrollable = rect.height - viewport;
      if (scrollable <= 0) {
        setProgress(rect.top <= 120 ? 1 : 0);
        return;
      }
      const raw = (120 - rect.top) / scrollable;
      setProgress(Math.min(1, Math.max(0, raw)));
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = el;
    const max = scrollHeight - clientHeight;
    setProgress(max <= 0 ? 1 : Math.min(1, scrollTop / max));
  }, [articleRef, useWindowScroll]);

  useEffect(() => {
    updateScrollProgress();
    window.addEventListener("scroll", updateScrollProgress, { passive: true });
    window.addEventListener("resize", updateScrollProgress);
    return () => {
      window.removeEventListener("scroll", updateScrollProgress);
      window.removeEventListener("resize", updateScrollProgress);
    };
  }, [updateScrollProgress]);

  useEffect(() => {
    if (sections.length === 0) return;
    const nodes = sections
      .map((s) => document.getElementById(s.id))
      .filter((n): n is HTMLElement => Boolean(n));
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveSectionId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75] },
    );

    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [sections]);

  const percentRead = Math.round(progress * 100);
  const minutesLeft = Math.max(0, Math.ceil(minutes * (1 - progress)));

  const activeSectionLabel =
    sections.find((s) => s.id === activeSectionId)?.label ?? null;

  return {
    minutes,
    progress,
    percentRead,
    minutesLeft,
    activeSectionId,
    activeSectionLabel,
  };
}

export function useReadTimeFromRef(
  articleRef: RefObject<HTMLElement | null>,
  options: Options = {},
): ReadTimeTrackerState {
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    const el = articleRef.current;
    if (!el) return;
    setWordCount(countWords(el.innerText));
  }, [articleRef]);

  return useReadTimeTracker(articleRef, wordCount, options);
}
