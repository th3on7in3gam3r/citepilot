export function FullAnalysisMock() {
  const metrics = [
    { label: "Prompts tracked", value: "12", icon: "📊" },
    { label: "Citation rate", value: "58%", icon: "✓" },
    { label: "Weekly actions", value: "7", icon: "→" },
  ];

  return (
    <div className="glass-light w-full overflow-hidden rounded-3xl">
      <div className="bg-gradient-to-br from-ink to-slate p-6 text-white md:p-8">
        <p className="text-xs font-medium uppercase tracking-wider text-white/45">
          Full citation analysis
        </p>
        <div className="mt-6 grid grid-cols-3 gap-4">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center"
            >
              <p className="text-2xl">{m.icon}</p>
              <p className="font-display mt-2 text-2xl font-bold md:text-3xl">
                {m.value}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-white/45">
                {m.label}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Top gap</span>
            <span className="font-semibold text-glow">Fix schema + FAQ</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-accent to-mint" />
          </div>
          <p className="mt-2 text-xs text-white/45">Est. citation lift +18% in 14 days</p>
        </div>
      </div>
      <div className="hidden border-t border-border bg-white p-4 md:block">
        <div className="flex flex-wrap gap-2">
          {["ChatGPT", "Perplexity", "Gemini", "Google AI", "Grok", "DeepSeek"].map((p, i) => (
            <span
              key={p}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                i < 4 ? "bg-mint/10 text-mint" : "bg-surface text-muted"
              }`}
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
