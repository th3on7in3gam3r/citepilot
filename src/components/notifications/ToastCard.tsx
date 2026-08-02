"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  TOAST_STYLES,
  type ToastRecord,
} from "@/lib/notifications/toast";

export function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastRecord;
  onDismiss: (id: string) => void;
}) {
  const styles = TOAST_STYLES[toast.type];
  const hasBody = Boolean(toast.description || toast.action);
  const [expanded, setExpanded] = useState(hasBody);
  const [paused, setPaused] = useState(false);
  const [remainingMs, setRemainingMs] = useState(toast.duration);

  const dismiss = useCallback(() => onDismiss(toast.id), [onDismiss, toast.id]);

  useEffect(() => {
    if (toast.duration <= 0) return;
    if (paused) return;

    let lastTick = Date.now();
    const tick = () => {
      const now = Date.now();
      const delta = now - lastTick;
      lastTick = now;

      setRemainingMs((prev) => Math.max(0, prev - delta));
    };

    const id = window.setInterval(tick, 50);
    return () => window.clearInterval(id);
  }, [toast.duration, paused]);

  useEffect(() => {
    if (toast.duration > 0 && remainingMs <= 0) {
      dismiss();
    }
  }, [remainingMs, toast.duration, dismiss]);

  const secondsLeft = Math.max(1, Math.ceil(remainingMs / 1000));
  const progressPct =
    toast.duration > 0 ? Math.min(100, (remainingMs / toast.duration) * 100) : 100;

  const isDark = toast.theme !== "light";

  const isError = toast.type === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={`w-[min(100vw-2rem,380px)] overflow-hidden rounded-2xl shadow-[0_12px_40px_rgba(15,23,42,0.18)] ring-1 ${
        isDark
          ? `bg-[#0f172a] text-white ring-white/10`
          : `bg-white text-[#0f172a] ring-[#e8edf3]`
      }`}
    >
      <div className="flex gap-3 px-4 pt-4">
        <span
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            isDark ? styles.icon : styles.lightIcon
          }`}
          aria-hidden
        >
          <ToastIcon type={toast.type} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold leading-snug">{toast.title}</p>
            <div className="flex shrink-0 items-center gap-0.5">
              {hasBody && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className={`rounded-lg p-1.5 transition ${
                    isDark
                      ? "text-white/50 hover:bg-white/10 hover:text-white"
                      : "text-[#94a3b8] hover:bg-[#f8fafb] hover:text-[#0f172a]"
                  }`}
                  aria-label={expanded ? "Collapse" : "Expand"}
                >
                  <svg
                    className={`h-4 w-4 transition ${expanded ? "" : "rotate-180"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                onClick={dismiss}
                className={`rounded-lg p-1.5 transition ${
                  isDark
                    ? "text-white/50 hover:bg-white/10 hover:text-white"
                    : "text-[#94a3b8] hover:bg-[#f8fafb] hover:text-[#0f172a]"
                }`}
                aria-label="Dismiss"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {expanded && toast.description && (
            <p
              className={`mt-2 text-sm leading-relaxed ${
                isDark ? "text-white/70" : "text-[#64748b]"
              }`}
            >
              {toast.description}
            </p>
          )}

          {expanded && toast.action && (
            <div className="mt-3">
              {toast.action.href ? (
                <Link
                  href={toast.action.href}
                  onClick={() => {
                    toast.action?.onClick?.();
                    dismiss();
                  }}
                  className={`inline-flex rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                    isDark
                      ? "border-white/25 text-white hover:bg-white/10"
                      : "border-[#e2e8f0] text-[#0f172a] hover:bg-[#f8fafb]"
                  }`}
                >
                  {toast.action.label}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onClick?.();
                    dismiss();
                  }}
                  className={`inline-flex rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                    isDark
                      ? "border-white/25 text-white hover:bg-white/10"
                      : "border-[#e2e8f0] text-[#0f172a] hover:bg-[#f8fafb]"
                  }`}
                >
                  {toast.action.label}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {toast.duration > 0 && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className={`mt-4 w-full px-4 pb-3 text-left text-xs ${
            isDark ? "text-white/45" : "text-[#94a3b8]"
          }`}
        >
          {paused ? (
            <>Timer paused. <span className="font-semibold">Click to resume.</span></>
          ) : (
            <>
              This message will close in{" "}
              <span className="font-semibold">{secondsLeft}</span> seconds.{" "}
              <span className="font-semibold">Click to stop.</span>
            </>
          )}
        </button>
      )}

      {toast.duration > 0 && (
        <div className={`h-1 w-full ${isDark ? "bg-white/10" : "bg-[#eef2f6]"}`}>
          <div
            className={`h-full transition-[width] duration-75 ease-linear ${styles.progress}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}
    </div>
  );
}

function ToastIcon({ type }: { type: ToastRecord["type"] }) {
  switch (type) {
    case "success":
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      );
    case "error":
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      );
    case "warning":
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      );
    default:
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}
