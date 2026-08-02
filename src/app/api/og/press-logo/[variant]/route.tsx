import {
  BRAND_GRADIENT,
  CitePilotLogoMark,
  phImageResponse,
} from "@/lib/og/ph-shared";

export const runtime = "edge";

const SIZE = { width: 800, height: 200 };

type Variant = "full-dark" | "full-light" | "mark" | "wordmark";

function PressLogo({ variant }: { variant: Variant }) {
  const dark = variant === "full-dark" || variant === "mark";
  const bg = variant === "full-light" ? "#ffffff" : variant === "mark" ? "transparent" : "#070b14";
  const textMain = dark ? "#ffffff" : "#0f172a";
  const textAccent = dark ? "#38bdf8" : "#0ea5e9";

  if (variant === "mark") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND_GRADIENT,
        }}
      >
        <CitePilotLogoMark size={120} />
      </div>
    );
  }

  if (variant === "wordmark") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
        }}
      >
        <span style={{ fontSize: 72, fontWeight: 800, color: textMain, fontFamily: "Inter" }}>
          Cite
          <span style={{ color: textAccent }}>Pilot</span>
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        background: bg,
        border: variant === "full-light" ? "2px solid #e2e8f0" : undefined,
      }}
    >
      <CitePilotLogoMark size={88} />
      <span style={{ fontSize: 64, fontWeight: 800, color: textMain, fontFamily: "Inter" }}>
        Cite
        <span style={{ color: textAccent }}>Pilot</span>
      </span>
    </div>
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ variant: string }> },
) {
  const { variant } = await context.params;
  const valid: Variant[] = ["full-dark", "full-light", "mark", "wordmark"];
  if (!valid.includes(variant as Variant)) {
    return new Response("Not found", { status: 404 });
  }

  return phImageResponse(<PressLogo variant={variant as Variant} />, SIZE);
}
