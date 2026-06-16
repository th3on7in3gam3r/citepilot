import { PUBLIC_SCORE_PLATFORMS, PLATFORM_SHORT_LABELS } from "@/lib/score/platforms";

type PlatformRow = { name: string; present: boolean };

export function ScorePlatformGrid({ platforms }: { platforms: PlatformRow[] }) {
  const rows = PUBLIC_SCORE_PLATFORMS.map((name) => {
    const match = platforms.find((p) => p.name === name);
    return { name, present: match?.present ?? false };
  });

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {rows.map((platform) => (
        <div
          key={platform.name}
          className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 shadow-sm"
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
              platform.present
                ? "bg-mint/15 text-mint"
                : "bg-red-50 text-red-500"
            }`}
            aria-hidden
          >
            {PLATFORM_SHORT_LABELS[platform.name as keyof typeof PLATFORM_SHORT_LABELS]}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{platform.name}</p>
            <p
              className={`text-xs font-medium ${
                platform.present ? "text-mint" : "text-muted"
              }`}
            >
              {platform.present ? "Cited ✓" : "Not cited"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
