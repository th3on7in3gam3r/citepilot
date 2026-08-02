import type { AuditPayload } from "@/lib/api-types";
import type { CompetitorMoveDelta } from "@/lib/audit/competitor-delta";
import { appBaseUrl } from "@/lib/stripe/config";

export function buildWeeklyDigestBlocks(input: {
  domain: string;
  score: number;
  previousScore: number | null;
  delta: CompetitorMoveDelta;
  topFix: string;
  estLift: string;
}): { blocks: unknown[]; text: string } {
  const rate = input.score;
  const prev = input.previousScore;
  const deltaPts =
    prev != null ? input.score - prev : null;
  const deltaLabel =
    deltaPts != null
      ? ` (${deltaPts >= 0 ? "+" : ""}${deltaPts}% this week)`
      : "";
  const arrow = deltaPts != null && deltaPts >= 0 ? "↑" : deltaPts != null ? "↓" : "";

  const gained = input.delta.promptsWon.slice(0, 3);
  const lost = input.delta.promptsLost.slice(0, 3);

  const changeLines: string[] = [];
  for (const row of gained) {
    changeLines.push(`✅ New citation: "${row.prompt}"`);
  }
  for (const row of lost) {
    changeLines.push(`⚠️ Lost citation: "${row.prompt}"`);
  }
  if (changeLines.length === 0) {
    changeLines.push("No prompt-level citation changes this week.");
  }

  const dashboardUrl = `${appBaseUrl()}/dashboard`;
  const reportUrl = `${appBaseUrl()}/report/proof`;

  const text = `CitePilot Weekly Digest — ${input.domain}: ${rate}% citation rate${deltaLabel}`;

  const blocks: unknown[] = [
    {
      type: "header",
      text: { type: "plain_text", text: `📊 CitePilot Weekly Digest — ${input.domain}`, emoji: true },
    },
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Citation rate:* ${rate}%${deltaLabel} ${arrow}`.trim(),
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: changeLines.join("\n"),
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Top fix this week:* ${input.topFix}\n*Est. lift:* ${input.estLift}`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "View full report →", emoji: true },
          url: reportUrl,
        },
        {
          type: "button",
          text: { type: "plain_text", text: "Open dashboard →", emoji: true },
          url: dashboardUrl,
        },
      ],
    },
  ];

  return { blocks, text };
}

export function buildCitationChangeBlocks(input: {
  domain: string;
  prompt: string;
  change: "gained" | "lost";
  platform: string;
  rateBefore: number;
  rateAfter: number;
}): { blocks: unknown[]; text: string } {
  const icon = input.change === "gained" ? "✅" : "⚠️";
  const label = input.change === "gained" ? "New citation" : "Lost citation";
  const text = `${label}: "${input.prompt}" on ${input.platform} — ${input.domain}`;
  const dashboardUrl = `${appBaseUrl()}/dashboard/analytics`;

  return {
    text,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${icon} *${label}:* "${input.prompt}" on *${input.platform}*\n_${input.domain}_ · rate ${Math.round(input.rateBefore * 100)}% → ${Math.round(input.rateAfter * 100)}%`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "View prompt →", emoji: true },
            url: dashboardUrl,
          },
        ],
      },
    ],
  };
}

export function topFixFromAudit(audit: AuditPayload): string {
  const gap = audit.gaps?.[0];
  if (!gap) return "Run a fresh audit to generate prioritized fixes";
  if (/schema|faq|json-ld/i.test(gap)) {
    return `Add FAQ schema to a high-intent page (${audit.domain})`;
  }
  return gap.slice(0, 120);
}

export function estLiftLabel(scoreDelta: number | null): string {
  if (scoreDelta == null || scoreDelta <= 0) return "+8–12% in 14 days";
  const lift = Math.min(20, Math.max(8, scoreDelta + 6));
  return `+${lift}% in 14 days`;
}
