import { Suspense } from "react";
import { TwoFactorChallengeForm } from "@/components/auth/TwoFactorChallengeForm";

export default function TwoFactorPage() {
  return (
    <Suspense fallback={<p className="text-center text-sm text-muted">Loading…</p>}>
      <TwoFactorChallengeForm />
    </Suspense>
  );
}
