import type { EditorialPillarId } from "@/lib/content-strategy";

/**
 * Curated stock photography for posts that never got a DALL·E cover.
 * Stable Unsplash / Pexels URLs — hashed by slug so each article keeps a
 * consistent image without burning image-gen quota.
 */
const STOCK_BY_PILLAR: Record<EditorialPillarId, readonly string[]> = {
  geo: [
    "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1600&q=80",
    "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1600",
  ],
  "seo-automation": [
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80",
    "https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=1600",
  ],
  "technical-seo": [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=1600&q=80",
    "https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=1600",
  ],
  "local-seo": [
    "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1600&q=80",
    "https://images.pexels.com/photos/3184333/pexels-photo-3184333.jpeg?auto=compress&cs=tinysrgb&w=1600",
  ],
  "paid-organic": [
    "https://images.unsplash.com/photo-1533750349088-cd871a92f312?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1600&q=80",
    "https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=1600",
  ],
  "agency-growth": [
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1600&q=80",
  ],
};

function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i += 1) {
    h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function stockCoverForPost(
  slug: string,
  pillar: EditorialPillarId | string,
): { coverImageUrl: string; coverImageAlt: string } {
  const key = (pillar in STOCK_BY_PILLAR
    ? pillar
    : "geo") as EditorialPillarId;
  const pool = STOCK_BY_PILLAR[key];
  const url = pool[hashSlug(slug) % pool.length]!;
  return {
    coverImageUrl: url,
    coverImageAlt: "Editorial cover image",
  };
}

/** Prefer stored cover; otherwise assign a deterministic stock photo. */
export function resolvePublicCover(input: {
  slug: string;
  pillar: string;
  coverImageUrl?: string | null;
  coverImageAlt?: string | null;
}): { coverImageUrl: string; coverImageAlt: string } {
  const existing = input.coverImageUrl?.trim();
  if (existing) {
    return {
      coverImageUrl: existing,
      coverImageAlt: input.coverImageAlt?.trim() || "Article cover",
    };
  }
  return stockCoverForPost(input.slug, input.pillar);
}
