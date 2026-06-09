import { Suspense } from "react";
import { SignUpForm } from "@/components/auth/SignUpForm";

export default function SignUpPage() {
  return (
    <Suspense fallback={<p className="text-center text-sm text-white/50">Loading…</p>}>
      <SignUpForm />
    </Suspense>
  );
}
