import { GeoAuditSeoIntro } from "@/components/dashboard/GeoAuditSeoIntro";
import type { Metadata } from "next";
import { GeoAuditPageClient } from "./GeoAuditPageClient";

export const metadata: Metadata = {
  title: "Technical GEO Audit & Citation Gaps",
  description:
    "Run technical GEO audits in CitePilot — schema, metadata, site signals, and citation gaps for ChatGPT, Perplexity & AI Overviews on your money prompts.",
};

export default function GeoAuditPage() {
  return (
    <>
      <GeoAuditPageClient />
      <GeoAuditSeoIntro />
    </>
  );
}
