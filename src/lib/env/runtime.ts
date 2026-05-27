/** True on Vercel production deployments. */
export function isProductionRuntime(): boolean {
  return process.env.VERCEL_ENV === "production";
}

/** Local `next dev` without Vercel env. */
export function isLocalDevelopment(): boolean {
  return !process.env.VERCEL_ENV && process.env.NODE_ENV !== "production";
}
