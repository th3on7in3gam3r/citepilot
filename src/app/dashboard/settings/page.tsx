import { SettingsSeoIntro } from "@/components/dashboard/SettingsSeoIntro";
import type { Metadata } from "next";
import { SettingsPageClient } from "./SettingsPageClient";

export const metadata: Metadata = {
  title: "GEO Citation Workspace Settings",
  description:
    "Configure GEO citation workspace settings in CitePilot — domain, money prompts, monitoring email, weekly alerts, Autopilot, and white-label reporting.",
};

export default function SettingsPage() {
  return (
    <>
      <SettingsPageClient />
      <SettingsSeoIntro />
    </>
  );
}
