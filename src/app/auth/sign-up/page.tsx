import { Suspense } from "react";
import { SignUpForm } from "@/components/auth/SignUpForm";

export default function SignUpPage() {
  return (
    <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">
        CitePilot account
      </p>
      <h1 className="font-display mt-2 text-2xl font-bold text-ink">
        Create account
      </h1>
      <p className="mt-2 text-sm text-muted">
        Your profile is stored in your Neon database via Neon Auth.
      </p>

      <div className="mt-6">
        <Suspense fallback={null}>
          <SignUpForm />
        </Suspense>
      </div>
    </div>
  );
}
