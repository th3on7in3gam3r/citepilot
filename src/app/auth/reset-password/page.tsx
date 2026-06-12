import { Suspense } from "react";
import { ResetPasswordForm } from "./ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <p className="text-center text-sm text-white/50">Loading…</p>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
