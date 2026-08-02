import Image from "next/image";
import Link from "next/link";

export function DashboardBrand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/dashboard"
      onClick={onNavigate}
      className="flex min-w-0 flex-1 items-center gap-3"
    >
      <span className="dash-rail__logo">
        <Image
          src="/logo-mark.svg"
          alt=""
          width={20}
          height={20}
          className="h-5 w-5"
          priority
        />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[14px] font-semibold leading-tight tracking-tight text-ink">
          CitePilot
        </span>
        <span className="block text-[11px] font-medium text-muted">Workspace</span>
      </span>
    </Link>
  );
}
