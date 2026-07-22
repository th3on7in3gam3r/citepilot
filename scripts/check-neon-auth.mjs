#!/usr/bin/env node
/**
 * Probe Neon Auth upstream + live app proxy (no secrets printed).
 * Usage: node scripts/check-neon-auth.mjs
 * Optional: APP_URL=https://getcitepilot.com node scripts/check-neon-auth.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadDotEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const eq = trimmed.indexOf("=");
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function hostPath(url) {
  try {
    const u = new URL(url);
    return `${u.host}${u.pathname}`;
  } catch {
    return "(invalid)";
  }
}

async function probe(label, url) {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    const body = (await res.text()).slice(0, 180).replace(/\s+/g, " ");
    const ok = res.ok || res.status === 401 || res.status === 403;
    console.log(
      `${ok ? "OK" : "FAIL"} ${label} HTTP ${res.status} ${body || "(empty)"}`,
    );
    return ok && res.status !== 404 && res.status !== 429;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.log(`FAIL ${label} ${message}`);
    return false;
  }
}

loadDotEnvLocal();

const base = process.env.NEON_AUTH_BASE_URL?.trim()?.replace(/\/$/, "");
const appUrl = (
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://getcitepilot.com"
)
  .trim()
  .replace(/\/$/, "");

console.log("Neon Auth check");
if (!base) {
  console.log("FAIL missing NEON_AUTH_BASE_URL (.env.local or env)");
  process.exit(1);
}
console.log(`upstream host ${hostPath(base)}`);
console.log(`app ${appUrl}`);

const upstreamOk = await probe("upstream /get-session", `${base}/get-session`);
const proxyOk = await probe("app /api/auth/get-session", `${appUrl}/api/auth/get-session`);

if (!upstreamOk) {
  console.log(
    "Hint: re-copy Auth URL from Neon Console → Auth → Configuration, or enable Auth if every path 404s.",
  );
}
if (upstreamOk && !proxyOk) {
  console.log(
    "Hint: upstream is healthy but the app proxy is not — set Render NEON_AUTH_BASE_URL to the same Auth URL and redeploy.",
  );
}

process.exit(upstreamOk && proxyOk ? 0 : 1);
