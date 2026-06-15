export function CitationDashboardMock({
  embedded = false,
  compact = false,
}: {
  embedded?: boolean;
  compact?: boolean;
}) {
  const shell = embedded
    ? "overflow-hidden rounded-lg border border-white/[0.08] bg-[#0a101c] sm:rounded-xl"
    : "mockup-shadow overflow-hidden rounded-3xl border border-white/10 bg-[#0d1526]";

  const chromePad = compact ? "px-3 py-2" : "px-4 py-3";
  const bodyPad = compact ? "p-3 sm:p-3.5" : "p-5";

  return (
    <div className={shell}>
      <div
        className={`flex items-center gap-2 border-b border-white/[0.08] bg-[#070b14] ${chromePad}`}
      >
        <span className={`rounded-full bg-[#ff5f57] ${compact ? "h-2 w-2" : "h-3 w-3"}`} />
        <span className={`rounded-full bg-[#febc2e] ${compact ? "h-2 w-2" : "h-3 w-3"}`} />
        <span className={`rounded-full bg-[#28c840] ${compact ? "h-2 w-2" : "h-3 w-3"}`} />
        <span className={`ml-1 font-medium text-white/50 ${compact ? "text-[10px]" : "text-xs"}`}>
          Citation Analysis
        </span>
        {compact && (
          <span className="ml-auto rounded-md bg-mint/15 px-2 py-0.5 text-[10px] font-semibold text-mint">
            Live
          </span>
        )}
      </div>

      <div className={bodyPad}>
        <div
          className={`flex items-center justify-between gap-3 ${compact ? "mb-3" : "mb-4"}`}
        >
          <div className="min-w-0">
            <p className={`text-white/45 ${compact ? "text-[10px]" : "text-xs"}`}>Domain</p>
            <p className={`truncate font-semibold tracking-tight text-white ${compact ? "text-sm" : ""}`}>
              brightlayer.io
            </p>
          </div>
          {!compact && (
            <span className="shrink-0 rounded-full bg-mint/20 px-3 py-1 text-xs font-bold text-mint">
              Scan complete
            </span>
          )}
        </div>

        <div
          className={`relative overflow-hidden border border-white/[0.08] bg-[#0d1424] ${
            compact ? "mb-3 rounded-lg p-3" : "mb-5 rounded-2xl p-4"
          }`}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-accent/25 to-transparent"
            style={{ animation: "scan-line 3s ease-in-out infinite" }}
          />
          <p className={`font-medium uppercase tracking-wider text-white/40 ${compact ? "text-[9px]" : "text-xs"}`}>
            Prompt scan
          </p>
          <p
            className={`mt-1 font-medium text-white ${compact ? "text-xs leading-snug sm:text-[13px]" : "text-sm"}`}
          >
            &ldquo;best CRM for agencies under 50 seats&rdquo;
          </p>
          <div
            className={`overflow-hidden rounded-full bg-white/[0.08] ${compact ? "mt-2.5 h-1.5" : "mt-4 h-2"}`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent via-glow to-mint shadow-[0_0_12px_rgba(34,211,238,0.45)]"
              style={{ width: "68%" }}
            />
          </div>
        </div>

        {!compact && (
          <>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Citation score", value: "72", sub: "/100" },
                { label: "Platforms", value: "4", sub: "/6" },
                { label: "Competitors", value: "2", sub: "ahead" },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 text-center"
                >
                  <p className="text-[10px] uppercase tracking-wide text-white/40">
                    {m.label}
                  </p>
                  <p className="font-display text-xl font-bold text-white">
                    {m.value}
                    <span className="text-sm font-normal text-white/40">{m.sub}</span>
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              {[
                { name: "ChatGPT", on: true },
                { name: "Perplexity", on: true },
                { name: "Grok", on: true },
                { name: "DeepSeek", on: false },
              ].map((p) => (
                <div
                  key={p.name}
                  className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-xs"
                >
                  <span className="text-white/70">{p.name}</span>
                  <span className={p.on ? "font-semibold text-mint" : "text-white/50"}>
                    {p.on ? "Cited" : "Missing"}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {compact && (
          <div className="flex flex-wrap gap-2">
            {[
              { name: "ChatGPT", on: true },
              { name: "Perplexity", on: true },
              { name: "Grok", on: true },
              { name: "DeepSeek", on: false },
            ].map((p) => (
              <span
                key={p.name}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium ${
                  p.on
                    ? "border-mint/25 bg-mint/10 text-mint"
                    : "border-white/10 bg-white/[0.04] text-white/55"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${p.on ? "bg-mint" : "bg-white/25"}`}
                />
                {p.name}
                <span className="font-normal opacity-80">{p.on ? "Cited" : "Missing"}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
