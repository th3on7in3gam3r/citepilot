export function ProductPreviewBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-border/80 bg-white/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted shadow-sm ${className}`}
    >
      Product preview
    </span>
  );
}
