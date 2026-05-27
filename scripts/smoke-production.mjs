#!/usr/bin/env node
/**
 * Automated checks from PRODUCTION.md against a live deployment.
 * Usage: node scripts/smoke-production.mjs [baseUrl]
 * Default: https://getcitepilot.com
 */

const base =
  (process.argv[2] || process.env.SMOKE_BASE_URL || "https://getcitepilot.com").replace(
    /\/$/,
    "",
  );

const results = [];

async function check(name, fn) {
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail });
    console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ name, ok: false, detail: message });
    console.log(`✗ ${name} — ${message}`);
  }
}

async function fetchStatus(path, init) {
  const res = await fetch(`${base}${path}`, {
    ...init,
    redirect: "follow",
  });
  return res;
}

await check("GET /api/health", async () => {
  const res = await fetchStatus("/api/health");
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(`status ${res.status}, ok=${data.ok}`);
  }
  const db = data.checks?.database?.detail ?? "unknown";
  const stripe = data.checks?.stripe?.ok ? "stripe ok" : "stripe missing";
  const resend = data.checks?.resend?.ok ? "resend ok" : "resend off";
  const cron = data.checks?.cron?.ok ? "cron secret set" : "cron secret missing";
  const gsc = data.checks?.googleSearchConsole?.ok ? "gsc ok" : "gsc off";
  return `${db}; ${stripe}; ${resend}; ${cron}; ${gsc}`;
});

await check("GET / (marketing)", async () => {
  const res = await fetchStatus("/");
  if (!res.ok) throw new Error(`status ${res.status}`);
  const html = await res.text();
  if (!html.includes("CitePilot")) throw new Error("missing brand in HTML");
  return `status ${res.status}`;
});

await check("GET /audit", async () => {
  const res = await fetchStatus("/audit");
  if (!res.ok) throw new Error(`status ${res.status}`);
  return `status ${res.status}`;
});

await check("GET /pricing", async () => {
  const res = await fetchStatus("/pricing");
  if (!res.ok) throw new Error(`status ${res.status}`);
  return `status ${res.status}`;
});

await check("GET /dashboard/help", async () => {
  const res = await fetchStatus("/dashboard/help");
  if (res.status !== 200 && res.status !== 307 && res.status !== 308) {
    throw new Error(`status ${res.status}`);
  }
  return `status ${res.status} (auth may redirect)`;
});

await check("GET /api/cron/weekly-rescan (no auth)", async () => {
  const res = await fetchStatus("/api/cron/weekly-rescan");
  if (res.status !== 401 && res.status !== 503) {
    throw new Error(`expected 401/503, got ${res.status}`);
  }
  return `status ${res.status} (protected)`;
});

await check("GET /api/cron/weekly-digest (no auth)", async () => {
  const res = await fetchStatus("/api/cron/weekly-digest");
  if (res.status !== 401 && res.status !== 503) {
    throw new Error(`expected 401/503, got ${res.status}`);
  }
  return `status ${res.status} (protected)`;
});

await check("POST /api/copilot (no auth)", async () => {
  const res = await fetchStatus("/api/copilot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "prioritize", workspaceId: "x" }),
  });
  if (res.status !== 401 && res.status !== 403) {
    throw new Error(`expected 401/403, got ${res.status}`);
  }
  return `status ${res.status} (auth required)`;
});

const failed = results.filter((r) => !r.ok);
console.log("\n---");
console.log(`Base URL: ${base}`);
console.log(`Passed: ${results.length - failed.length}/${results.length}`);

if (failed.length > 0) {
  console.log("\nFailed:");
  for (const f of failed) {
    console.log(`  - ${f.name}: ${f.detail}`);
  }
  process.exit(1);
}

console.log("\nAutomated smoke checks passed.");
console.log(
  "Manual (PRODUCTION.md): sign-in, onboarding, audit run, CMS publish, GSC OAuth, Stripe checkout, email alerts.",
);
