import { Suspense } from "react";
import { AuthFormFallback } from "@/components/auth/AuthFormFallback";
import { SignUpForm } from "@/components/auth/SignUpForm";

export default function SignUpPage() {
  return (
    <Suspense fallback={<AuthFormFallback />}>
      <SignUpForm />
    </Suspense>
  );
}
