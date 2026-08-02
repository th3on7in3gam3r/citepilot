"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ToastCard } from "@/components/notifications/ToastCard";
import {
  normalizeToast,
  type ToastInput,
  type ToastRecord,
  type ToastType,
} from "@/lib/notifications/toast";

type ToastContextValue = {
  toasts: ToastRecord[];
  push: (input: ToastInput) => string;
  success: (title: string, input?: Omit<ToastInput, "title" | "type">) => string;
  error: (title: string, input?: Omit<ToastInput, "title" | "type">) => string;
  warning: (title: string, input?: Omit<ToastInput, "title" | "type">) => string;
  info: (title: string, input?: Omit<ToastInput, "title" | "type">) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_TOASTS = 5;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => setToasts([]), []);

  const push = useCallback((input: ToastInput) => {
    const record = normalizeToast(input);
    setToasts((prev) => [record, ...prev].slice(0, MAX_TOASTS));
    return record.id;
  }, []);

  const pushTyped = useCallback(
    (type: ToastType, title: string, input?: Omit<ToastInput, "title" | "type">) =>
      push({ ...input, type, title }),
    [push],
  );

  const value = useMemo(
    (): ToastContextValue => ({
      toasts,
      push,
      success: (title, input) => pushTyped("success", title, input),
      error: (title, input) => pushTyped("error", title, input),
      warning: (title, input) => pushTyped("warning", title, input),
      info: (title, input) => pushTyped("info", title, input),
      dismiss,
      dismissAll,
    }),
    [toasts, push, pushTyped, dismiss, dismissAll],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed top-4 right-4 z-[90] flex flex-col gap-3 sm:top-5 sm:right-5"
        aria-label="Notifications"
        aria-live="polite"
        role="region"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastCard toast={toast} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
