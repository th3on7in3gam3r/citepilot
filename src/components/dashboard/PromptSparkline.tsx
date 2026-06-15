/** Inline 4-point citation trend sparkline (no chart library). */
export function PromptSparkline({
  values,
  positive = true,
  className = "",
}: {
  values: number[];
  positive?: boolean;
  className?: string;
}) {
  const pts = values.length >= 2 ? values : [0, 0, 0, 0];
  const w = 56;
  const h = 20;
  const max = Math.max(...pts, 1);
  const min = Math.min(...pts, 0);
  const range = Math.max(max - min, 1);

  const path = pts
    .map((v, i) => {
      const x = (i / (pts.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 2) - 1;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const stroke = positive ? "#0ea5e9" : "#f43f5e";

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      aria-hidden
    >
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
