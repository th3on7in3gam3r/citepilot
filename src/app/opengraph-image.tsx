import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "CitePilot — citation tracking for AI search";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #04060c 0%, #0a1628 45%, #0e7490 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 36,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "rgba(14,165,233,0.2)",
              border: "2px solid rgba(14,165,233,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 800,
              color: "#38bdf8",
            }}
          >
            CP
          </div>
          <span style={{ fontSize: 56, fontWeight: 800, letterSpacing: -1 }}>
            CitePilot
          </span>
        </div>
        <p
          style={{
            fontSize: 40,
            fontWeight: 700,
            lineHeight: 1.2,
            maxWidth: 900,
            margin: 0,
          }}
        >
          Track citations in AI answers — then prove what moved.
        </p>
        <p style={{ fontSize: 24, color: "rgba(255,255,255,0.65)", marginTop: 24 }}>
          GEO platform for ChatGPT, Perplexity & Google AI Overviews
        </p>
      </div>
    ),
    { ...size },
  );
}
