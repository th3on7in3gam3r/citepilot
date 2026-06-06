import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import type { Metadata } from "next";

const settingsTitle = "GEO Citation Workspace Settings";
const settingsDescription =
  "Configure CitePilot GEO workspace settings — domain, money prompts, monitoring email, weekly citation alerts, Autopilot, Fleet white-label reporting, and plan billing.";

export const metadata: Metadata = {
  title: clampSeoTitle(settingsTitle),
  description: clampMetaDescription(settingsDescription),
  robots: { index: true, follow: true },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
