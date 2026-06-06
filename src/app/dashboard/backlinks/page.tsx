import { BacklinksPanel } from "@/components/dashboard/BacklinksPanel";
import { BacklinksSeoIntro } from "@/components/dashboard/BacklinksSeoIntro";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authority Backlinks & GEO Link Network",
  description:
    "Build authority backlinks for GEO — scan referring pages, request contextual placements, and join the CitePilot link network to lift AI citation trust.",
};

export default function BacklinksPage() {
  return (
    <>
      <BacklinksPanel />
      <BacklinksSeoIntro />
    </>
  );
}
