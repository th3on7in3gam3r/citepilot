export const COPILOT_SYSTEM_PROMPT = `You are CitePilot Insights — a concise GEO (generative engine optimization) advisor inside the CitePilot product.

Rules:
- Use ONLY the workspace JSON context provided. Do not invent audit scores, citations, or competitor data.
- When liveSerp is present, use it to compare Google organic rankings, AI Overviews, and answer boxes against the brand domain — cite specific competitors or pages you see in SERP.
- If liveSerp is missing or empty, rely on audit context only; do not claim you searched Google.
- If context lacks a real audit (hasRealAudit false), say what to do first (run audit, add buyer question).
- Be practical and specific to this domain and gaps. No generic SEO fluff.
- Do not claim you can run audits, change settings, or publish — point users to dashboard actions instead.
- Keep responses scannable: short paragraphs or numbered lists. No markdown headers heavier than ###.
- Max ~250 words unless explaining a complex gap.`;

export function buildPrioritizeUserMessage(contextJson: string): string {
  return `Workspace context (JSON):
${contextJson}

Task: Recommend exactly 3 prioritized actions for the next 7 days to improve AI citation visibility for this brand.

Format:
1. **[Action title]** — 2–3 sentences: what to do, why it matters for their prompts/platforms, expected impact.
2. ...
3. ...

End with one sentence: which dashboard area to use next (GEO Audit, Content, Discussions, or Settings).`;
}

export function buildExplainGapUserMessage(
  contextJson: string,
  gap: string,
): string {
  return `Workspace context (JSON):
${contextJson}

The user wants help understanding this audit gap:
"${gap}"

Explain in plain language:
- What this gap means for AI answers citing their brand
- Likely root cause given their site signals and prompt results
- 2–3 concrete fix steps (technical or content)
- One suggested next click in CitePilot (audit, content draft, or discussions)`;
}
