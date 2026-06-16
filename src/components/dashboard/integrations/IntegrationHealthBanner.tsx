"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { effectInit } from "@/lib/react/effect-init";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";

export function IntegrationHealthBanner() {
  const { workspace, ready } = useWorkspaceContext();
  const workspaceId = workspace?.workspaceId ?? workspace?.id;
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!workspaceId) return;
    effectInit(() => {
      void fetch(
        `/api/integrations/status?workspaceId=${encodeURIComponent(workspaceId)}&verify=1`,
        { credentials: "include" },
      )
        .then((r) => (r.ok ? r.json() : null))
        .then(
          (data: { errorProviders?: string[] } | null) =>
            setErrors(data?.errorProviders ?? []),
        )
        .catch(() => setErrors([]));
    });
  }, [workspaceId]);

  if (!ready || errors.length === 0) return null;

  const label = errors
    .map((id) => id.charAt(0).toUpperCase() + id.slice(1))
    .join(", ");

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p>
        Your <span className="font-semibold">{label}</span> connection needs attention —{" "}
        <Link
          href="/dashboard/settings/integrations"
          className="font-semibold text-accent hover:underline"
        >
          Go to Settings → Integrations
        </Link>
      </p>
    </div>
  );
}
