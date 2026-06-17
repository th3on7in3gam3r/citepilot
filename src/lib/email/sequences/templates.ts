import type { GapFixType, SequenceEmailPayload } from "./types";
import { PILOT_PRICE_LABEL } from "./constants";
import { appBaseUrl } from "@/lib/stripe/config";
import { dashboardUrl } from "@/lib/email/config";
import { unsubscribeUrl } from "@/lib/email/unsubscribe";

export function classifyGapFixType(topGap: string): GapFixType {
  const g = topGap.toLowerCase();
  if (
    g.includes("schema") ||
    g.includes("json-ld") ||
    g.includes("faqpage") ||
    g.includes("organization")
  ) {
    return "schema";
  }
  if (
    g.includes("content") ||
    g.includes("thin") ||
    g.includes("h1") ||
    g.includes("prompt")
  ) {
    return "content";
  }
  return "entity";
}

function footer(userId: string): string {
  return `<p style="margin-top:32px;font-size:12px;color:#64748b">
You're receiving this because you have a CitePilot account.
<a href="${unsubscribeUrl(userId)}" style="color:#64748b">Unsubscribe</a> from marketing emails.
</p>`;
}

function layout(userId: string, body: string): string {
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.6;color:#0f172a;max-width:560px;margin:0 auto;padding:24px">
${body}
${footer(userId)}
</body></html>`;
}

function cta(href: string, label: string): string {
  return `<p style="margin:24px 0"><a href="${href}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600">${label}</a></p>`;
}

export type RenderedEmail = { subject: string; html: string; text: string };

export function renderSequenceEmail(
  userId: string,
  sequence: string,
  emailNumber: number,
  data: SequenceEmailPayload,
): RenderedEmail | null {
  const domain = data.domain ?? "your site";
  const name = data.userName?.trim() || "there";
  const auditUrl = `${appBaseUrl()}/audit`;
  const pricingUrl = `${appBaseUrl()}/pricing`;
  const dashboard = dashboardUrl("/dashboard");
  const geoPlaybook = `${appBaseUrl()}/tools/geo-playbook`;
  const portalUrl = dashboardUrl("/dashboard/settings");

  if (sequence === "free_onboarding") {
    if (emailNumber === 1) {
      return {
        subject: "Run your first CitePilot audit →",
        html: layout(
          userId,
          `<h1 style="font-size:22px;margin:0 0 12px">Your free citation audit is ready</h1>
<p>Hi ${name},</p>
<p>Welcome to CitePilot. Here's your 60-second quick start:</p>
<ol>
<li>Enter your domain (e.g. <strong>${domain !== "your site" ? domain : "yourcompany.com"}</strong>)</li>
<li>Pick 3 money prompts — the questions buyers ask AI before they choose a vendor</li>
<li>Run the audit — we check ChatGPT, Perplexity, and more for citations</li>
</ol>
<p>You'll get a citation score, top gaps, and a shareable report.</p>
${cta(auditUrl, "Start your audit")}`,
        ),
        text: `Your free CitePilot audit is ready. Enter your domain, pick 3 money prompts, run the audit: ${auditUrl}`,
      };
    }
    if (emailNumber === 2) {
      return {
        subject: "Your competitors might already be tracking this",
        html: layout(
          userId,
          `<h1 style="font-size:22px;margin:0 0 12px">Still curious where AI cites you?</h1>
<p>Hi ${name},</p>
<p>Teams using CitePilot found citation gaps their competitors had already closed — one SaaS brand went from invisible to cited on 4/10 buyer prompts in 30 days after fixing schema and FAQ pages.</p>
<p>Your free audit takes about 60 seconds.</p>
${cta(auditUrl, "Run audit — takes 60 seconds")}`,
        ),
        text: `Still curious where AI cites you? Run your free audit: ${auditUrl}`,
      };
    }
    if (emailNumber === 3) {
      return {
        subject: "What happens after your free audit",
        html: layout(
          userId,
          `<h1 style="font-size:22px;margin:0 0 12px">Your citation score is just a baseline</h1>
<p>Hi ${name},</p>
<p>A free audit is a snapshot. Pilot adds weekly monitoring, 25 tracked prompts, CMS publishing, and alerts when competitors move.</p>
<ul>
<li>Weekly rescans — catch citation drops before they compound</li>
<li>25 monitored money prompts across AI engines</li>
<li>Proof reports you can share with stakeholders</li>
</ul>
${cta(pricingUrl, `Start Pilot — ${PILOT_PRICE_LABEL}`)}`,
        ),
        text: `Your citation score is a baseline. Pilot adds weekly monitoring: ${pricingUrl}`,
      };
    }
  }

  if (sequence === "post_audit") {
    const score = data.score ?? 0;
    const topGap = data.topGap ?? "Improve structured data and answer capsules on key pages";
    const shareUrl = data.shareUrl ?? auditUrl;
    const scorePageUrl = data.scorePageUrl;
    if (emailNumber === 1) {
      const scorePageBlock =
        scorePageUrl != null
          ? `<p>Your public GEO score page (shareable &amp; indexed):</p>
${cta(scorePageUrl, "View public score page →")}`
          : "";
      return {
        subject: `Your CitePilot audit results for ${domain}`,
        html: layout(
          userId,
          `<h1 style="font-size:22px;margin:0 0 12px">Audit results for ${domain}</h1>
<p>Hi ${name},</p>
<p><strong>Citation score: ${score}/100</strong> · ${data.cited ?? 0}/${data.total ?? 0} prompts cited</p>
<p><strong>Top gap:</strong> ${topGap}</p>
<p><strong>Recommended first fix:</strong> Address your highest-impact gap this week — small technical and content fixes often move the needle fastest.</p>
${cta(shareUrl, "See full proof report →")}
${scorePageBlock}`,
        ),
        text: `Audit for ${domain}: ${score}/100. Top gap: ${topGap}. Proof report: ${shareUrl}${
          scorePageUrl != null ? ` Public score page: ${scorePageUrl}` : ""
        }`,
      };
    }
    if (emailNumber === 2) {
      const fixType = data.gapFixType ?? classifyGapFixType(topGap);
      const fixBody =
        fixType === "schema"
          ? `<p>Your top gap points to <strong>structured data</strong>. Add Organization + FAQPage JSON-LD on pages that answer buyer questions. AI systems extract quotable blocks from schema-backed content.</p>`
          : fixType === "content"
            ? `<p>Your top gap is <strong>content depth</strong>. Add an answer capsule above the fold: definition, proof point, and a comparison table. Make the first paragraph quotable by ChatGPT and Perplexity.</p>`
            : `<p>Your top gap is <strong>entity trust</strong>. Strengthen brand signals: consistent naming, authoritative external mentions, and Organization schema so AI models recognize you as the canonical source.</p>`;
      return {
        subject: `The #1 fix for ${domain}'s citation score`,
        html: layout(
          userId,
          `<h1 style="font-size:22px;margin:0 0 12px">Here's how to fix your top citation gap</h1>
<p>Hi ${name},</p>
${fixBody}
<p>Our GEO Playbook walks through fixes step-by-step.</p>
${cta(geoPlaybook, "Open GEO Playbook →")}`,
        ),
        text: `#1 fix for ${domain}: see GEO Playbook at ${geoPlaybook}`,
      };
    }
  }

  if (sequence === "pilot_retention") {
    if (emailNumber === 1) {
      return {
        subject: "Pilot activated — here's what to do first",
        html: layout(
          userId,
          `<h1 style="font-size:22px;margin:0 0 12px">Welcome to Pilot</h1>
<p>Hi ${name},</p>
<p>Your Pilot plan is active. Complete this checklist in your first session:</p>
<ol>
<li><strong>Add 25 money prompts</strong> — Settings → Citation tracking</li>
<li><strong>Connect your CMS</strong> — publish GEO content without copy-paste</li>
<li><strong>Set alert threshold</strong> — get emailed when your score drops</li>
</ol>
${cta(dashboard, "Open dashboard →")}`,
        ),
        text: `Pilot activated. Add prompts, connect CMS, set alerts: ${dashboard}`,
      };
    }
    if (emailNumber === 3) {
      const prompts = data.total ?? 0;
      const scans = data.score ?? 0;
      return {
        subject: "Your citation progress this month",
        html: layout(
          userId,
          `<h1 style="font-size:22px;margin:0 0 12px">Your citation progress this month</h1>
<p>Hi ${name},</p>
<p>Here's what Pilot has been doing for you:</p>
<ul>
<li><strong>${prompts}</strong> prompts tracked</li>
<li><strong>${scans}</strong> audits / scans run</li>
<li>Latest citation score: <strong>${data.cited ?? "—"}/100</strong></li>
</ul>
<p>Consistent monitoring is how teams prove GEO lift to stakeholders — keep the momentum going.</p>
${cta(dashboardUrl("/dashboard/analytics"), "View analytics →")}`,
        ),
        text: `Your CitePilot progress: ${prompts} prompts, ${scans} scans. Analytics: ${dashboardUrl("/dashboard/analytics")}`,
      };
    }
  }

  if (sequence === "churn_prevention") {
    if (emailNumber === 1) {
      return {
        subject: "Your CitePilot subscription needs attention",
        html: layout(
          userId,
          `<h1 style="font-size:22px;margin:0 0 12px">Action needed — update payment</h1>
<p>Hi ${name},</p>
<p>We couldn't process your latest CitePilot payment. Your account is still active for now — please update your payment method to avoid any interruption to monitoring and alerts.</p>
${cta(portalUrl, "Update payment method →")}`,
        ),
        text: `Update your CitePilot payment method: ${portalUrl}`,
      };
    }
    if (emailNumber === 2) {
      return {
        subject: "Final reminder — CitePilot payment pending",
        html: layout(
          userId,
          `<h1 style="font-size:22px;margin:0 0 12px">Final reminder before pause</h1>
<p>Hi ${name},</p>
<p>Your payment is still outstanding. If we can't process it soon, Pilot features (weekly scans, CMS publish, alerts) will pause.</p>
<p>Update your card in one click — takes 30 seconds.</p>
${cta(portalUrl, "Update payment →")}`,
        ),
        text: `Final payment reminder for CitePilot: ${portalUrl}`,
      };
    }
  }

  return null;
}

/** Dynamic pilot week-1 check-in (content depends on prompt count at send time). */
export function renderPilotWeekCheckIn(
  userId: string,
  data: SequenceEmailPayload & { promptCount: number },
): RenderedEmail {
  const name = data.userName?.trim() || "there";
  const settingsUrl = dashboardUrl("/dashboard/settings");
  const promptsUrl = dashboardUrl("/dashboard/settings#prompts");

  if (data.promptCount > 0) {
    return {
      subject: "Your first week of citation monitoring",
      html: layout(
        userId,
        `<h1 style="font-size:22px;margin:0 0 12px">Your first week of citation monitoring</h1>
<p>Hi ${name},</p>
<p>You're tracking <strong>${data.promptCount}</strong> money prompts — nice work. Check Analytics for citation trends and share proof reports with your team.</p>
${cta(dashboardUrl("/dashboard/analytics"), "View monitoring summary →")}`,
      ),
      text: `First week on Pilot: ${data.promptCount} prompts tracked.`,
    };
  }

  return {
    subject: "Your first week of citation monitoring",
    html: layout(
      userId,
      `<h1 style="font-size:22px;margin:0 0 12px">Add your money prompts this week</h1>
<p>Hi ${name},</p>
<p>Pilot works best when you track the prompts buyers actually ask AI. Add at least 5 to start — we recommend 25 for full coverage.</p>
${cta(settingsUrl, "Add prompts in Settings →")}`,
    ),
    text: `Add your money prompts in CitePilot Settings: ${settingsUrl}`,
  };
}

/** Enrich pilot retention email 3 payload with live stats. */
export function renderPilotValueRecap(
  userId: string,
  stats: {
    promptCount: number;
    scanCount: number;
    latestScore: number | null;
    userName?: string;
  },
): RenderedEmail {
  return renderSequenceEmail(userId, "pilot_retention", 3, {
    userName: stats.userName,
    total: stats.promptCount,
    score: stats.scanCount,
    cited: stats.latestScore ?? undefined,
  })!;
}
