export function AuthDivider() {
  return (
    <div className="my-6 flex items-center gap-4">
      <span className="h-px flex-1 bg-border" aria-hidden />
      <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
        Or email
      </span>
      <span className="h-px flex-1 bg-border" aria-hidden />
    </div>
  );
}
