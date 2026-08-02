import { Suspense } from "react";
import { SettingsSeoIntro } from "@/components/dashboard/SettingsSeoIntro";
import { SettingsPageClient } from "./SettingsPageClient";

export default function SettingsPage() {
  return (
    <>
      <SettingsSeoIntro section="header" />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-surface" />}>
        <SettingsPageClient />
      </Suspense>
      <SettingsSeoIntro section="footer" />
    </>
  );
}
