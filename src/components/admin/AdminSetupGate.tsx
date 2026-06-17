import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

type Props = {
  signedInEmail: string;
};

export function AdminSetupGate({ signedInEmail }: Props) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-cream px-6">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-white p-8 shadow-sm">
        <Logo className="mb-6" />
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
          Admin console
        </p>
        <h1 className="font-display mt-2 text-2xl font-bold text-ink">
          Admin access not configured
        </h1>
        <p className="mt-3 text-sm text-muted">
          You are signed in as{" "}
          <span className="font-medium text-ink">{signedInEmail}</span>, but the
          production server has no admin allowlist yet.
        </p>
        <ol className="mt-6 list-decimal space-y-3 pl-5 text-sm text-ink">
          <li>
            In Vercel → Project → Settings → Environment Variables, add{" "}
            <code className="rounded bg-cream px-1.5 py-0.5 text-xs">ADMIN_EMAILS</code>{" "}
            with your Neon Auth email (comma-separated for multiple admins).
          </li>
          <li>Redeploy the app so the variable is available at runtime.</li>
          <li>
            Return to{" "}
            <Link href="/admin" className="font-semibold text-accent hover:underline">
              /admin
            </Link>{" "}
            while signed in with that same email.
          </li>
        </ol>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white"
          >
            Go to dashboard
          </Link>
          <Link
            href="/auth/sign-in?from=/admin"
            className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-ink"
          >
            Switch account
          </Link>
        </div>
      </div>
    </div>
  );
}
