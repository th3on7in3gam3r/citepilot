"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { WhiteLabelProofPreview } from "@/components/report/WhiteLabelProofPreview";

function ProofReportPreviewInner() {
  const searchParams = useSearchParams();
  const embed = searchParams.get("embed") === "1";
  return <WhiteLabelProofPreview embed={embed} />;
}

export default function ProofReportPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
          Loading preview…
        </div>
      }
    >
      <ProofReportPreviewInner />
    </Suspense>
  );
}
