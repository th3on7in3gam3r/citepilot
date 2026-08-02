import { Suspense } from "react";
import { TeamSettingsPageClient } from "./TeamSettingsPageClient";

export default function TeamSettingsPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-surface" />}>
      <TeamSettingsPageClient />
    </Suspense>
  );
}
