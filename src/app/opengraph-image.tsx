import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "CitePilot — citation tracking for AI search";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INTER_FONT = fetch(
  "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff",
).then((res) => res.arrayBuffer());

export default async function OpenGraphImage() {
  const inter = await INTER_FONT;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(145deg, #04060c 0%, #0c1512 45%, #0e7490 100%)",
          color: "white",
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "rgba(14,165,233,0.2)",
              border: "2px solid rgba(56,189,248,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: 800,
              color: "#38bdf8",
            }}
          >
            CP
          </div>
          <span style={{ fontSize: 52, fontWeight: 800, letterSpacing: -1 }}>
            CitePilot
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p
            style={{
              fontSize: 52,
              fontWeight: 800,
              lineHeight: 1.15,
              maxWidth: 920,
              margin: 0,
            }}
          >
            Track citations in ChatGPT, Perplexity & Google AI
          </p>
          <p style={{ fontSize: 28, color: "rgba(255,255,255,0.7)", margin: 0 }}>
            GEO score · weekly monitoring · proof reports for clients
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
            fontSize: 22,
            color: "#10b981",
            fontWeight: 700,
          }}
        >
          <span>Free audit →</span>
          <span style={{ color: "rgba(255,255,255,0.5)" }}>getcitepilot.com</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Inter", data: inter, style: "normal", weight: 700 }],
    },
  );
}
