export function AuthSuccessAlert({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      role="status"
      className="rounded-xl border border-mint/30 bg-mint/10 px-4 py-4 text-sm text-foreground/90"
    >
      <p className="font-semibold text-mint">{title}</p>
      <div className="mt-2 text-muted">{children}</div>
    </div>
  );
}
