/** Placeholder while below-the-fold home sections load via dynamic import. */
export function HomeSectionSkeleton({
  variant = "default",
  dark = false,
}: {
  variant?: "default" | "comparison" | "marquee" | "showcase";
  dark?: boolean;
}) {
  const heights: Record<typeof variant, string> = {
    default: "min-h-[24rem]",
    comparison: "min-h-[28rem]",
    marquee: "min-h-[70vh]",
    showcase: "min-h-[48rem]",
  };

  return (
    <div
      className={`${heights[variant]} ${dark ? "bg-[#04060c]" : "bg-white"} animate-pulse`}
      aria-hidden
    >
      <div className="mx-auto flex h-full max-w-6xl flex-col items-center justify-center gap-4 px-4 py-16">
        <div
          className={`h-3 w-32 rounded-full ${dark ? "bg-white/10" : "bg-border"}`}
        />
        <div
          className={`h-8 w-2/3 max-w-md rounded-xl ${dark ? "bg-white/10" : "bg-border"}`}
        />
        <div
          className={`mt-4 h-48 w-full max-w-4xl rounded-2xl ${dark ? "bg-white/[0.06]" : "bg-surface"}`}
        />
      </div>
    </div>
  );
}
