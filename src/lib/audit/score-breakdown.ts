/** Matches runCitationAudit score formula (45% technical + 55% citation). */
export type AuditScoreBreakdown = {
  geoScore: number;
  cited: number;
  total: number;
  citedPercent: number;
  technicalPoints: number;
  citationPoints: number;
  combinedScore: number;
};

export function auditScoreBreakdown(input: {
  geoScore: number;
  cited: number;
  total: number;
}): AuditScoreBreakdown {
  const total = Math.max(input.total, 1);
  const citedPercent = Math.round((input.cited / total) * 100);
  const technicalPoints = Math.round(input.geoScore * 0.45);
  const citationPoints = Math.round((input.cited / total) * 100 * 0.55);
  const combinedScore = Math.round(
    input.geoScore * 0.45 + (input.cited / total) * 100 * 0.55,
  );

  return {
    geoScore: input.geoScore,
    cited: input.cited,
    total,
    citedPercent,
    technicalPoints,
    citationPoints,
    combinedScore,
  };
}

export function formatScoreDelta(delta: number | null): string {
  if (delta == null || delta === 0) return "No change";
  return delta > 0 ? `+${delta}` : String(delta);
}
