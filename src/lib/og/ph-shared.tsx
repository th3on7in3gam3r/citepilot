import { ImageResponse } from "next/og";

export const PH_THUMB_SIZE = { width: 240, height: 240 };
export const PH_GALLERY_SIZE = { width: 1270, height: 760 };

export const INTER_FONT = fetch(
  "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff",
).then((res) => res.arrayBuffer());

export const BRAND_GRADIENT =
  "linear-gradient(145deg, #04060c 0%, #0c1512 45%, #0e7490 100%)";

export function CitePilotLogoMark({ size = 72 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        background: "rgba(14,165,233,0.2)",
        border: "2px solid rgba(56,189,248,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.42,
        fontWeight: 800,
        color: "#38bdf8",
      }}
    >
      CP
    </div>
  );
}

export async function phImageResponse(
  element: React.ReactElement,
  size: { width: number; height: number },
) {
  const inter = await INTER_FONT;
  return new ImageResponse(element, {
    ...size,
    fonts: [{ name: "Inter", data: inter, style: "normal", weight: 700 }],
    headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
    },
  });
}
