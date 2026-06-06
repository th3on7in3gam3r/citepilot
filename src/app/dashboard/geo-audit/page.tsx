import { GeoAuditSeoIntro } from "@/components/dashboard/GeoAuditSeoIntro";
import { GeoAuditPageClient } from "./GeoAuditPageClient";

export default function GeoAuditPage() {
  return (
    <>
      <GeoAuditSeoIntro section="header" />
      <GeoAuditPageClient />
      <GeoAuditSeoIntro section="footer" />
    </>
  );
}
