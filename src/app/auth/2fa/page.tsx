import { Suspense } from "react";
import { AuthFormFallback } from "@/components/auth/AuthFormFallback";
import { TwoFactorChallengeForm } from "@/components/auth/TwoFactorChallengeForm";

export default function TwoFactorPage() {
  return (
    <Suspense fallback={<AuthFormFallback />}>
      <TwoFactorChallengeForm />
    </Suspense>
  );
}
