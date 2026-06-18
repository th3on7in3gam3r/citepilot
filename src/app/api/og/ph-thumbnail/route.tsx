import {
  BRAND_GRADIENT,
  CitePilotLogoMark,
  PH_THUMB_SIZE,
  phImageResponse,
} from "@/lib/og/ph-shared";

export const runtime = "edge";

export async function GET() {
  return phImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND_GRADIENT,
          color: "white",
          fontFamily: "Inter",
          gap: 20,
        }}
      >
        <CitePilotLogoMark size={120} />
        <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: -0.5 }}>
          CitePilot
        </span>
      </div>
    ),
    PH_THUMB_SIZE,
  );
}
