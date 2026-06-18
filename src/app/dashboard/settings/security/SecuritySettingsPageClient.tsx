"use client";

import { TwoFactorSettingsPanel } from "@/components/dashboard/settings/TwoFactorSettingsPanel";
import { FleetRequire2faPanel } from "@/components/dashboard/settings/FleetRequire2faPanel";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SecuritySettingsContent() {
  const searchParams = useSearchParams();
  const require2fa = searchParams.get("require2fa") === "1";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Security</h1>
        <p className="mt-1 text-sm text-muted">
          Manage two-factor authentication and account security settings.
        </p>
      </div>
      <TwoFactorSettingsPanel require2fa={require2fa} />
      <FleetRequire2faPanel />
    </div>
  );
}

export function SecuritySettingsPageClient() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading security settings…</p>}>
      <SecuritySettingsContent />
    </Suspense>
  );
}
