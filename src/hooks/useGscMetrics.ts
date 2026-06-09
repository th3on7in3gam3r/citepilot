"use client";

import { useCallback, useEffect, useState } from "react";
import type { GscMetrics } from "@/lib/gsc/client";

type GscState = {
  metrics: GscMetrics | null;
  configured: boolean;
  loading: boolean;
  error: string | null;
  connected: boolean;
  refresh: () => Promise<void>;
};

export function useGscMetrics(workspaceId: string | undefined): GscState {
  const [metrics, setMetrics] = useState<GscMetrics | null>(null);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(Boolean(workspaceId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!workspaceId) {
      setMetrics(null);
      setConfigured(false);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/gsc/metrics?workspaceId=${encodeURIComponent(workspaceId)}`,
        { credentials: "include" },
      );

      if (!res.ok) {
        setError("Could not load Search Console data.");
        setMetrics(null);
        setLoading(false);
        return;
      }

      const data = (await res.json()) as {
        configured?: boolean;
        metrics: GscMetrics;
      };
      setConfigured(Boolean(data.configured));
      setMetrics(data.metrics);
    } catch {
      setError("Could not load Search Console data.");
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    metrics,
    configured,
    loading,
    error,
    connected: Boolean(metrics?.connected),
    refresh: load,
  };
}
