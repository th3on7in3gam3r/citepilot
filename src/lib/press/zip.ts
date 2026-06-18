import { readFile } from "fs/promises";
import { join } from "path";
import { zipSync } from "fflate";
import { pressLogoAssets, pressScreenshots } from "@/lib/press/content";
import { site } from "@/lib/site";

async function readPublicFile(publicPath: string): Promise<Uint8Array | null> {
  try {
    const buf = await readFile(join(process.cwd(), "public", publicPath.replace(/^\//, "")));
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

async function fetchBinary(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

function siteBase(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    site.wwwUrl.replace(/\/$/, "")
  );
}

export async function buildBrandAssetsZip(): Promise<Uint8Array> {
  const files: Record<string, Uint8Array> = {};
  const base = siteBase();

  for (const asset of pressLogoAssets) {
    const svgBytes = await readPublicFile(asset.svg);
    if (svgBytes) {
      files[`svg/${asset.id}.svg`] = svgBytes;
    }

    const png = await fetchBinary(`${base}${asset.png}`);
    if (png) {
      files[`png/${asset.id}.png`] = png;
    }
  }

  const readme = `CitePilot brand assets
Usage: Do not modify logos. Use on white or dark backgrounds only.
Contact: press@getcitepilot.com
`;
  files["README.txt"] = new TextEncoder().encode(readme);

  return zipSync(files);
}

export async function buildScreenshotsZip(): Promise<Uint8Array> {
  const files: Record<string, Uint8Array> = {};
  const base = siteBase();

  for (const shot of pressScreenshots) {
    const png = await fetchBinary(`${base}${shot.image}`);
    if (png) {
      files[shot.filename] = png;
    }
  }

  return zipSync(files);
}
