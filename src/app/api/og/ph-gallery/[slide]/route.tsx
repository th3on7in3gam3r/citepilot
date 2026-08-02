import {
  BRAND_GRADIENT,
  CitePilotLogoMark,
  PH_GALLERY_SIZE,
  phImageResponse,
} from "@/lib/og/ph-shared";

export const runtime = "edge";

type SlideConfig = {
  headline: string;
  sub?: string;
  caption?: string;
  mock?: "heatmap" | "actions" | "competitors" | "proof" | "prompts" | "digest";
};

const SLIDES: Record<string, SlideConfig> = {
  "1": {
    headline: "Is ChatGPT citing your brand?",
    sub: "Find out in 60 seconds — free",
  },
  "2": {
    headline: "Citation heatmap",
    caption: "See every prompt × platform citation at a glance",
    mock: "heatmap",
  },
  "3": {
    headline: "Weekly action plan",
    caption: "Ranked fixes — not vague scores. Know exactly what to do next.",
    mock: "actions",
  },
  "4": {
    headline: "Competitor share of voice",
    caption: "See where competitors are cited — and steal their citations",
    mock: "competitors",
  },
  "5": {
    headline: "Proof report",
    caption: "Show clients citation lift over time. Shareable in one link.",
    mock: "proof",
  },
  "6": {
    headline: "Prompt tracking",
    caption: "Monitor money prompts across ChatGPT, Perplexity, and Google AI",
    mock: "prompts",
  },
  "7": {
    headline: "Weekly digest",
    caption: "Citation changes and alerts delivered to your inbox",
    mock: "digest",
  },
};

function MockPanel({ type }: { type: SlideConfig["mock"] }) {
  if (type === "heatmap") {
    const cells = [
      ["✓", "—", "✓", "✓"],
      ["—", "✓", "—", "✓"],
      ["✓", "✓", "✓", "—"],
    ];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 24 }}>
        {cells.map((row, ri) => (
          <div key={ri} style={{ display: "flex", gap: 8 }}>
            {row.map((cell, ci) => (
              <div
                key={ci}
                style={{
                  width: 72,
                  height: 48,
                  borderRadius: 8,
                  background:
                    cell === "✓" ? "rgba(16,185,129,0.35)" : "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  color: cell === "✓" ? "#10b981" : "rgba(255,255,255,0.35)",
                }}
              >
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (type === "actions") {
    const items = [
      "Add FAQ schema to pricing page",
      "Publish answer capsule for top prompt",
      "Strengthen brand entity on homepage",
    ];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
        {items.map((item, i) => (
          <div
            key={item}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 18px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              fontSize: 20,
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                background: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 800,
              }}
            >
              {i + 1}
            </span>
            {item}
          </div>
        ))}
      </div>
    );
  }

  if (type === "competitors") {
    const rows = [
      { name: "Your brand", pct: 58, you: true },
      { name: "Competitor A", pct: 72, you: false },
      { name: "Competitor B", pct: 41, you: false },
    ];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 24, width: 520 }}>
        {rows.map((row) => (
          <div key={row.name} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18 }}>
              <span style={{ fontWeight: row.you ? 800 : 600 }}>{row.name}</span>
              <span style={{ color: row.you ? "#10b981" : "rgba(255,255,255,0.7)" }}>
                {row.pct}%
              </span>
            </div>
            <div
              style={{
                height: 12,
                borderRadius: 999,
                background: "rgba(255,255,255,0.1)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${row.pct}%`,
                  height: "100%",
                  background: row.you ? "#10b981" : "rgba(56,189,248,0.7)",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "proof") {
    return (
      <div
        style={{
          marginTop: 24,
          padding: 24,
          borderRadius: 16,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 42, fontWeight: 800, color: "#10b981" }}>+16 pts</div>
        <div style={{ fontSize: 20, color: "rgba(255,255,255,0.75)" }}>
          Citation rate this month · 4/8 prompts cited
        </div>
        <div style={{ fontSize: 16, color: "#38bdf8" }}>Shareable proof link →</div>
      </div>
    );
  }

  if (type === "prompts") {
    const rows = [
      { prompt: "Best CRM for startups", cited: true },
      { prompt: "Top project management tools", cited: false },
      { prompt: "Alternatives to Salesforce", cited: true },
    ];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24, width: 560 }}>
        {rows.map((row) => (
          <div
            key={row.prompt}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 18px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              fontSize: 18,
            }}
          >
            <span>{row.prompt}</span>
            <span style={{ color: row.cited ? "#10b981" : "#f87171", fontWeight: 700 }}>
              {row.cited ? "Cited" : "Missing"}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (type === "digest") {
    return (
      <div
        style={{
          marginTop: 24,
          padding: 24,
          borderRadius: 16,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          width: 520,
        }}
      >
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
          Weekly citation digest
        </div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>3 prompts gained citations this week</div>
        <div style={{ fontSize: 16, color: "rgba(255,255,255,0.75)" }}>
          ChatGPT ↑ · Perplexity → · Google AI ↑
        </div>
        <div style={{ fontSize: 15, color: "#38bdf8" }}>View full report →</div>
      </div>
    );
  }

  return null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slide: string }> },
) {
  const { slide } = await context.params;
  const config = SLIDES[slide];
  if (!config) {
    return new Response("Not found", { status: 404 });
  }

  const isHook = slide === "1";

  return phImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: isHook ? "72px 80px" : "56px 64px",
          background: BRAND_GRADIENT,
          color: "white",
          fontFamily: "Inter",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 900 }}>
          <p
            style={{
              fontSize: isHook ? 64 : 44,
              fontWeight: 800,
              lineHeight: 1.1,
              margin: 0,
              letterSpacing: -1,
            }}
          >
            {config.headline}
          </p>
          {config.sub && (
            <p style={{ fontSize: 32, color: "rgba(255,255,255,0.75)", margin: 0 }}>
              {config.sub}
            </p>
          )}
          {config.caption && (
            <p style={{ fontSize: 24, color: "#10b981", margin: 0, fontWeight: 600 }}>
              {config.caption}
            </p>
          )}
          {config.mock && <MockPanel type={config.mock} />}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 22, color: "rgba(255,255,255,0.55)" }}>
            getcitepilot.com
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <CitePilotLogoMark size={48} />
            <span style={{ fontSize: 28, fontWeight: 800 }}>CitePilot</span>
          </div>
        </div>
      </div>
    ),
    PH_GALLERY_SIZE,
  );
}
