export function ScanMock() {
  return (
    <div className="glass-light w-full overflow-hidden rounded-3xl p-1">
      <div className="rounded-[1.35rem] bg-gradient-to-br from-slate-100 to-white p-6">
        <div className="relative mx-auto aspect-[4/3] max-w-sm overflow-hidden rounded-2xl border border-border bg-ink">
          <div className="absolute inset-0 bg-gradient-to-b from-accent/20 via-transparent to-glow/10" />
          <div
            className="absolute left-4 right-4 h-1 rounded-full bg-glow shadow-[0_0_20px_#22d3ee]"
            style={{ animation: "scan-line 2.5s ease-in-out infinite" }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
              <svg className="h-8 w-8 text-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
              </svg>
            </div>
            <p className="text-sm font-medium">Scanning AI surfaces…</p>
            <p className="mt-2 text-xs text-white/50">8 platforms · 3 prompts</p>
          </div>
          <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-black/50 px-3 py-2 backdrop-blur">
            <p className="text-xs text-white/60">Citation gap detected</p>
            <p className="font-display text-lg font-bold text-mint">Citation gap: -31%</p>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted">Auto-scan · High precision</p>
      </div>
    </div>
  );
}
