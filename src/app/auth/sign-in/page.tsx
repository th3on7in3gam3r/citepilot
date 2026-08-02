import { Suspense } from "react";
import { AuthFormFallback } from "@/components/auth/AuthFormFallback";
import { SignInForm } from "./SignInForm";

export default function SignInPage() {
  return (
    <Suspense fallback={<AuthFormFallback />}>
      <SignInForm />
    </Suspense>
  );
}
