"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type BillingContextValue = {
  ready: boolean;
  isPilot: boolean;
  isFleet: boolean;
  isPaid: boolean;
  planLabel: string;
};

const defaultValue: BillingContextValue = {
  ready: false,
  isPilot: false,
  isFleet: false,
  isPaid: false,
  planLabel: "Free (Audit)",
};

const BillingContext = createContext<BillingContextValue>(defaultValue);

export function BillingProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<BillingContextValue>(defaultValue);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/billing/status", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          data: {
            isPilot?: boolean;
            isFleet?: boolean;
            isPaid?: boolean;
            planLabel?: string;
          } | null,
        ) => {
          if (cancelled) return;
          setValue({
            ready: true,
            isPilot: Boolean(data?.isPilot),
            isFleet: Boolean(data?.isFleet),
            isPaid: Boolean(data?.isPaid),
            planLabel: data?.planLabel ?? "Free (Audit)",
          });
        },
      )
      .catch(() => {
        if (!cancelled) {
          setValue((prev) => ({ ...prev, ready: true }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <BillingContext.Provider value={value}>{children}</BillingContext.Provider>
  );
}

export function useBilling(): BillingContextValue {
  return useContext(BillingContext);
}

/** Pilot or Fleet — unlocks paid dashboard features. */
export function usePaidFeatures(): boolean {
  const { isPaid, ready } = useBilling();
  return ready && isPaid;
}
