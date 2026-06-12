import { site } from "@/lib/site";
import {
  buildJsonLdBlock,
  isSnippetFixId,
  type SnippetFixId,
} from "@/lib/geo/fixes";

export const CITEPILOT_GEO_MARKER = 'data-citepilot="geo"';
export const CITEPILOT_GEO_BLOCK_START = "<!-- citepilot:geo-snippet -->";
export const CITEPILOT_GEO_BLOCK_END = "<!-- /citepilot:geo-snippet -->";

export function geoSnippetScriptUrl(workspaceId: string): string {
  return `${site.url}/geo/${encodeURIComponent(workspaceId)}.js`;
}

export function geoSnippetScriptTag(workspaceId: string): string {
  return `<script src="${geoSnippetScriptUrl(workspaceId)}" defer ${CITEPILOT_GEO_MARKER}></script>`;
}

export function geoSnippetBlockHtml(workspaceId: string): string {
  return `${CITEPILOT_GEO_BLOCK_START}\n${geoSnippetScriptTag(workspaceId)}\n${CITEPILOT_GEO_BLOCK_END}`;
}

export function stripGeoSnippetFromHtml(existingHtml: string | null): string {
  return (existingHtml ?? "")
    .replace(
      new RegExp(
        `${escapeRegExp(CITEPILOT_GEO_BLOCK_START)}[\\s\\S]*?${escapeRegExp(CITEPILOT_GEO_BLOCK_END)}`,
        "g",
      ),
      "",
    )
    .replace(
      new RegExp(
        `<script[^>]+${escapeRegExp(CITEPILOT_GEO_MARKER)}[^>]*>\\s*</script>`,
        "gi",
      ),
      "",
    )
    .trim();
}

export function mergeGeoSnippetIntoHtml(existingHtml: string | null, workspaceId: string): string {
  const withoutBlock = stripGeoSnippetFromHtml(existingHtml);

  const block = geoSnippetBlockHtml(workspaceId);
  return withoutBlock ? `${withoutBlock}\n\n${block}` : block;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildGeoSnippetJavaScript(input: {
  domain: string;
  enabledFixes: string[];
}): string {
  const blocks = input.enabledFixes
    .filter(isSnippetFixId)
    .map((fixId) => buildJsonLdBlock(fixId as SnippetFixId, input.domain));

  const payload = JSON.stringify(blocks);
  return `(function(){
  if(typeof document==="undefined")return;
  var blocks=${payload};
  blocks.forEach(function(block){
    if(!block||typeof block!=="object")return;
    var s=document.createElement("script");
    s.type="application/ld+json";
    s.setAttribute("data-citepilot","geo-ld");
    s.text=JSON.stringify(block);
    document.head.appendChild(s);
  });
})();`;
}

export function homepageHasGeoSnippet(html: string, workspaceId: string): boolean {
  const encodedId = encodeURIComponent(workspaceId);
  return (
    html.includes(CITEPILOT_GEO_MARKER) ||
    html.includes(`/geo/${workspaceId}.js`) ||
    html.includes(`/geo/${encodedId}.js`) ||
    html.includes(CITEPILOT_GEO_BLOCK_START)
  );
}

export function applyGeoSnippetSignals<T extends {
  hasJsonLd: boolean;
  hasFaqSchema: boolean;
  hasOrganizationSchema: boolean;
}>(input: {
  signals: T;
  html: string;
  workspaceId: string;
  enabledFixes: string[];
}): T {
  if (!homepageHasGeoSnippet(input.html, input.workspaceId)) {
    return input.signals;
  }

  const next = { ...input.signals };
  for (const fixId of input.enabledFixes) {
    if (fixId === "faq-schema") {
      next.hasFaqSchema = true;
      next.hasJsonLd = true;
    }
    if (fixId === "org-schema") {
      next.hasOrganizationSchema = true;
      next.hasJsonLd = true;
    }
  }

  return next;
}
