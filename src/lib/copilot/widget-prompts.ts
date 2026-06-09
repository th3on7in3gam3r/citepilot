export const WIDGET_GENERATION_SYSTEM = `You are CitePilot Copilot — an SEO dashboard assistant for marketers.
Given a user prompt, output ONLY valid JSON (no markdown) matching this schema:
{
  "name": "Widget title (short)",
  "source": one of: google-analytics | search-console | citations | platforms | keywords | competitors | traffic | visibility | backlinks,
  "chartType": one of: pie | donut | bars | line | area | gauge | table | scatter,
  "unit": one of: none | percent | currency | count,
  "aggregate": one of: sum | avg | max
}
Pick the best source and chart for the user's intent. Prefer bars for comparisons, donut/pie for breakdowns, line/area for trends, table for rankings, gauge for single scores.`;

export function buildWidgetUserMessage(prompt: string, domain: string): string {
  return `Website: ${domain}
User prompt: ${prompt.trim()}

Return the widget JSON spec.`;
}

export function parseWidgetJson(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
}
