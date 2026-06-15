import { ImageResponse } from "next/og";
import type { AuditOgData } from "@/lib/audit/share";

export const OG_SIZE = { width: 1200, height: 630 };

const INTER_FONT = fetch(
  "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff",
).then((res) => res.arrayBuffer());

export async function renderAuditOgImage(data: AuditOgData) {
  const inter = await INTER_FONT;

  const platformGrid = data.platforms.slice(0, 8).map((p) => {
    const short = p.name.replace(/ AI| Overviews/gi, "").slice(0, 12);
    return `${short} ${p.present ? "✓" : "✗"}`;
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 64px",
          background: "linear-gradient(145deg, #04060c 0%, #0c1512 40%, #0a1628 100%)",
          color: "#f8fafc",
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 28,
              fontWeight: 700,
              color: "#38bdf8",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: "rgba(14,165,233,0.2)",
                border: "2px solid rgba(56,189,248,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              CP
            </div>
            CitePilot
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              letterSpacing: -2,
              lineHeight: 1.05,
              maxWidth: 680,
            }}
          >
            {data.domain}
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, color: "#10b981" }}>
            GEO Score: {data.score}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            maxWidth: 900,
          }}
        >
          {platformGrid.map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 18px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            color: "rgba(248,250,252,0.65)",
          }}
        >
          <span>
            {data.citedPrompts}/{data.totalPrompts} prompts cited
          </span>
          <span style={{ fontWeight: 600, color: "#94a3b8" }}>
            Tracked by CitePilot — getcitepilot.com
          </span>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [{ name: "Inter", data: inter, style: "normal", weight: 700 }],
    },
  );
}
