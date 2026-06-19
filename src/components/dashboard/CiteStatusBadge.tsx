import { citeStatusTier } from "@/lib/score/cite-status";

export function CiteStatusBadge({
  score,
  size = "md",
}: {
  score: number;
  size?: "sm" | "md";
}) {
  const tier = citeStatusTier(score);
  const sizeClass =
    size === "sm"
      ? "px-2 py-0.5 text-[10px]"
      : "px-2.5 py-1 text-[11px]";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold uppercase tracking-wide ${sizeClass} ${tier.badgeClass}`}
      title={tier.description}
    >
      {tier.id === "highly-citeable" ? "★ " : ""}
      {tier.label}
    </span>
  );
}
