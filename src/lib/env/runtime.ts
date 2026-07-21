/** True on Vercel production or Render production web services. */
export function isProductionRuntime(): boolean {
  if (process.env.VERCEL_ENV === "production") return true;
  // Render sets RENDER=true on all services; treat NODE_ENV=production as live.
  if (process.env.RENDER === "true" && process.env.NODE_ENV === "production") {
    return true;
  }
  return false;
}

/** Local `next dev` without Vercel/Render platform env. */
export function isLocalDevelopment(): boolean {
  if (process.env.VERCEL_ENV) return false;
  if (process.env.RENDER === "true") return false;
  return process.env.NODE_ENV !== "production";
}

/** Public hostname for this deploy (no protocol), when the platform provides one. */
export function platformHost(): string | null {
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return vercel.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const render = process.env.RENDER_EXTERNAL_URL?.trim();
  if (render) {
    try {
      return new URL(render).host;
    } catch {
      return render.replace(/^https?:\/\//, "").replace(/\/$/, "");
    }
  }
  return null;
}
