import { Logo } from "@/components/ui/Logo";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-cream px-6 py-12">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-md">{children}</div>
      <Link
        href="/"
        className="mt-8 text-sm font-medium text-muted hover:text-ink"
      >
        ← Back to CitePilot
      </Link>
    </div>
  );
}
