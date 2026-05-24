import Link from "next/link";
import Image from "next/image";
import { site } from "@/lib/site";

export function Logo({
  light = false,
  className = "",
  showWordmark = true,
}: {
  light?: boolean;
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 font-display text-lg font-bold tracking-tight ${className}`}
    >
      <Image
        src="/logo-mark.svg"
        alt=""
        width={32}
        height={32}
        className="h-8 w-8 shrink-0"
        priority
        aria-hidden
      />
      {showWordmark && (
        <span className={light ? "text-white" : "text-ink"}>
          {site.name.slice(0, 4)}
          <span className="text-accent">{site.name.slice(4)}</span>
        </span>
      )}
    </Link>
  );
}
