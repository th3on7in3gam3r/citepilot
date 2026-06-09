import { Logo } from "@/components/ui/Logo";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[100dvh]">
      {/* LEFT PANEL — desktop only */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-cream">
        {/* Top: logo */}
        <div>
          <Logo />
        </div>
        {/* Middle: headline + value props */}
        <div className="max-w-sm">
          <h2 className="font-display text-4xl font-bold text-ink leading-tight">
            Cite smarter,<br />not harder.
          </h2>
          <p className="mt-4 text-base text-muted">
            CitePilot tracks where your brand gets cited by AI — and helps you earn more citations.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              { icon: "✦", label: "AI-powered citation tracking" },
              { icon: "◈", label: "Instant brand visibility scores" },
              { icon: "⬡", label: "Share-ready audit reports" },
            ].map(({ icon, label }) => (
              <li key={label} className="flex items-center gap-3">
                <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent text-sm font-bold">
                  {icon}
                </span>
                <span className="text-sm font-medium text-ink">{label}</span>
              </li>
            ))}
          </ul>
        </div>
        {/* Bottom: back link */}
        <div>
          <Link href="/" className="text-sm font-medium text-muted hover:text-ink transition-colors">
            ← Back to CitePilot
          </Link>
        </div>
      </div>

      {/* RIGHT PANEL — dark with glow */}
      <div className="relative overflow-hidden hero-premium flex flex-col items-center justify-center min-h-[100dvh] px-4 py-12">
        {/* Glow orb */}
        <div aria-hidden="true" className="hero-premium-orb hero-premium-orb--cyan" />
        {/* Mobile-only logo */}
        <div className="lg:hidden mb-8 relative z-10">
          <Logo light={true} />
        </div>
        {/* Form children */}
        <div className="relative z-10 w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
