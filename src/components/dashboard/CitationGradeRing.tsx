"use client";

import {
  letterGradeClassName,
  ringStrokeClassName,
  type CitationLetterGrade,
} from "@/lib/citation-grade";

const SIZE = 168;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CitationGradeRing({
  letterGrade,
  citationScore,
  promptsCited,
  promptsTotal,
  promptCitationPct,
  hasPromptBreakdown,
  hasRealAudit,
}: {
  letterGrade: CitationLetterGrade;
  citationScore: number;
  promptsCited: number;
  promptsTotal: number;
  promptCitationPct: number | null;
  hasPromptBreakdown: boolean;
  hasRealAudit: boolean;
}) {
  const pct = Math.max(0, Math.min(100, citationScore));
  const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;
  const ringLabel = `${letterGrade} grade, citation score ${pct} out of 100`;

  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-8"
      aria-label={ringLabel}
    >
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="-rotate-90"
          role="img"
          aria-hidden
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            className="stroke-white/10"
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            className={`${ringStrokeClassName(letterGrade)} transition-[stroke-dashoffset] duration-700`}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span
            className={`font-display text-5xl font-bold leading-none ${letterGradeClassName(letterGrade)}`}
          >
            {letterGrade}
          </span>
          <span className="mt-1 text-2xl font-semibold text-white">{pct}%</span>
          <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/50">
            Citation score
          </span>
        </div>
      </div>

      <p className="mt-5 text-center text-sm text-white/70">
        {hasPromptBreakdown ? (
          <>
            <span className="font-semibold text-white">
              {promptsCited}/{promptsTotal}
            </span>{" "}
            money prompts cited
            {promptCitationPct !== null && (
              <span className="text-white/50"> · {promptCitationPct}%</span>
            )}
          </>
        ) : hasRealAudit ? (
          "Prompt-level cited counts load after your latest audit syncs."
        ) : (
          <>
            Run a{" "}
            <span className="font-semibold text-emerald-400">GEO audit</span> to
            score money prompts
          </>
        )}
      </p>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
          {hasRealAudit ? "Audit live" : "Awaiting audit"}
        </span>
        <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/60">
          GEO tracked
        </span>
      </div>
    </div>
  );
}
