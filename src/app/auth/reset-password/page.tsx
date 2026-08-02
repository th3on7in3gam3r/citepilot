import { Suspense } from "react";
import { AuthFormFallback } from "@/components/auth/AuthFormFallback";
import { ResetPasswordForm } from "./ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthFormFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
