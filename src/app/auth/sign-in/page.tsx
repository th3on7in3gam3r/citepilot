import { Suspense } from "react";
import { SignInForm } from "./SignInForm";

export default function SignInPage() {
  return (
    <Suspense fallback={<p className="text-center text-sm text-white/50">Loading…</p>}>
      <SignInForm />
    </Suspense>
  );
}
