#!/usr/bin/env node
/**
 * Export Product Hunt OG images to static PNGs under public/press/.
 *
 * Start the dev server first, then:
 *   node scripts/generate-press-assets.mjs
 *
 * Or point at production:
 *   BASE_URL=https://getcitepilot.com node scripts/generate-press-assets.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "public", "press");

const base =
  process.env.BASE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

const assets = [
  { url: `${base}/api/og/ph-thumbnail`, file: "ph-thumbnail.png" },
  ...Array.from({ length: 5 }, (_, i) => ({
    url: `${base}/api/og/ph-gallery/${i + 1}`,
    file: `ph-gallery-${i + 1}.png`,
  })),
];

async function fetchPng(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`${url} → ${res.status} ${res.statusText}`);
  }
  const type = res.headers.get("content-type") ?? "";
  if (!type.includes("image")) {
    throw new Error(`${url} did not return an image (${type})`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  await mkdir(outDir, { recursive: true });
  console.log(`Exporting press assets from ${base} → public/press/`);

  for (const asset of assets) {
    const buf = await fetchPng(asset.url);
    const dest = path.join(outDir, asset.file);
    await writeFile(dest, buf);
    console.log(`  ✓ ${asset.file} (${buf.length} bytes)`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err.message || err);
  console.error("\nTip: run `npm run dev` in another terminal, then retry.");
  process.exit(1);
});
