import Link from "next/link";
import { nav } from "@/lib/site";

function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function HeaderStartButton({ onDark }: { onDark: boolean }) {
  const label = nav.startAnalysis.label;

  if (onDark) {
    return (
      <Link
        href={nav.startAnalysis.href}
        className="group relative shrink-0 rounded-full p-[1px] transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98]"
      >
        <span
          className="absolute inset-0 rounded-full bg-gradient-to-r from-glow/70 via-accent to-mint/70 opacity-90 blur-[2px] transition-opacity group-hover:opacity-100"
          aria-hidden
        />
        <span className="relative flex items-center gap-2 rounded-full border border-white/10 bg-[#0a0f1a]/90 px-3.5 py-2 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(14,165,233,0.18)] backdrop-blur-md sm:gap-2.5 sm:px-4 sm:py-2.5">
          <span className="hidden sm:inline">{label}</span>
          <span className="sm:hidden">Start</span>
          <span className="hidden rounded-md bg-mint/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-mint lg:inline">
            Free
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white transition group-hover:bg-white/20">
            <ArrowIcon className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={nav.startAnalysis.href}
      className="group relative inline-flex shrink-0 items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[#6b8cff] via-accent to-accent-deep px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(14,165,233,0.4)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_6px_28px_rgba(14,165,233,0.5)] active:scale-[0.98] sm:gap-2.5 sm:px-5"
    >
      <span
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />
      <span className="relative hidden sm:inline">{label}</span>
      <span className="relative sm:hidden">Start</span>
      <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-white/20 transition group-hover:bg-white/30">
        <ArrowIcon className="transition-transform duration-300 group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
