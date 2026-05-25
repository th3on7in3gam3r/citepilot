import type { Metadata } from "next";
import { ProofReportPage } from "@/components/report/ProofReportPage";

export const metadata: Metadata = {
  title: "Proof Report",
  robots: { index: false, follow: false },
};

export default function ProofReportRoute() {
  return <ProofReportPage />;
}
