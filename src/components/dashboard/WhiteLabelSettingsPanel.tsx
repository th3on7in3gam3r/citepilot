"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FeatureGate } from "@/components/billing/FeatureGate";
import { SettingsToggleRow } from "@/components/dashboard/SettingsToggleRow";
import { WhiteLabelProofPreview } from "@/components/report/WhiteLabelProofPreview";
import { useUpgradeModalOptional } from "@/contexts/UpgradeModalContext";
import type { WorkspacePreferences } from "@/lib/settings";
import {
  DEFAULT_PRIMARY_COLOR,
  WHITE_LABEL_PREVIEW_KEY,
  type WhiteLabelPreviewState,
} from "@/lib/white-label/types";
import { normalizePrimaryColor, logoSrcForWorkspace } from "@/lib/white-label/theme";
import { cnameDnsHost } from "@/lib/white-label/dns-guide";

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-[#333] dark:bg-[#141414]";

type WhiteLabelSettingsPanelProps = {
  workspaceId: string;
  preferences: WorkspacePreferences;
  isFleet: boolean;
  isPilot: boolean;
  togglesBusy: boolean;
  onPreferencesChange: (next: WorkspacePreferences, toast?: string) => void;
  onPreferencesDraft: (next: WorkspacePreferences) => void;
};

export function WhiteLabelSettingsPanel({
  workspaceId,
  preferences,
  isFleet,
  isPilot,
  togglesBusy,
  onPreferencesChange,
  onPreferencesDraft,
}: WhiteLabelSettingsPanelProps) {
  const wl = preferences.whiteLabel;
  const [cnameTarget, setCnameTarget] = useState("reports.getcitepilot.com");
  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputId = `wl-logo-upload-${workspaceId}`;
  const upgradeModal = useUpgradeModalOptional();

  useEffect(() => {
    void fetch("/api/white-label/verify-domain")
      .then((r) => r.json())
      .then((json: { target?: string }) => {
        if (json.target) setCnameTarget(json.target);
      })
      .catch(() => undefined);
  }, []);

  const previewState = useMemo<WhiteLabelPreviewState>(
    () => ({
      agencyName: wl.agencyName,
      logoUrl: wl.logoUrl,
      hidePoweredBy: wl.poweredByMode === "agency_primary",
      poweredByMode: wl.poweredByMode,
      primaryColor: normalizePrimaryColor(wl.primaryColor),
      customReportDomain: wl.customReportDomain,
      emailFromName: wl.emailFromName,
    }),
    [wl],
  );

  const syncPreview = useCallback(
    (next: WorkspacePreferences) => {
      const state: WhiteLabelPreviewState = {
        agencyName: next.whiteLabel.agencyName,
        logoUrl: next.whiteLabel.logoUrl,
        hidePoweredBy: next.whiteLabel.poweredByMode === "agency_primary",
        poweredByMode: next.whiteLabel.poweredByMode,
        primaryColor: normalizePrimaryColor(next.whiteLabel.primaryColor),
        customReportDomain: next.whiteLabel.customReportDomain,
        emailFromName: next.whiteLabel.emailFromName,
      };
      try {
        localStorage.setItem(WHITE_LABEL_PREVIEW_KEY, JSON.stringify(state));
      } catch {
        /* ignore */
      }
    },
    [],
  );

  useEffect(() => {
    syncPreview(preferences);
  }, [preferences, syncPreview]);

  function patchWhiteLabel(
    patch: Partial<WorkspacePreferences["whiteLabel"]>,
    draftOnly = false,
  ) {
    const nextWl = {
      ...wl,
      ...patch,
      hidePoweredBy:
        patch.poweredByMode !== undefined
          ? patch.poweredByMode === "agency_primary"
          : patch.hidePoweredBy ?? wl.hidePoweredBy,
    };
    const next = { ...preferences, whiteLabel: nextWl };
    onPreferencesDraft(next);
    syncPreview(next);
    if (!draftOnly) onPreferencesChange(next, "White label settings saved.");
  }

  const logoPreviewSrc = useMemo(() => {
    const trimmed = wl.logoUrl.trim();
    if (!trimmed) return "";
    if (trimmed.includes("/api/white-label/logo") && !trimmed.includes("workspaceId=")) {
      return logoSrcForWorkspace(workspaceId, "");
    }
    return trimmed;
  }, [wl.logoUrl, workspaceId]);

  async function uploadLogo(file: File) {
    if (!isFleet) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.set("workspaceId", workspaceId);
      form.set("logo", file);
      const res = await fetch("/api/white-label/logo", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const json = (await res.json()) as { ok?: boolean; logoUrl?: string; error?: string };
      if (!res.ok || !json.logoUrl) {
        throw new Error(json.error ?? "Upload failed");
      }
      patchWhiteLabel({ logoUrl: json.logoUrl });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Logo upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function verifyDomain() {
    if (!isFleet || !wl.customReportDomain.trim()) return;
    setVerifying(true);
    setVerifyStatus(null);
    try {
      const res = await fetch("/api/white-label/verify-domain", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          domain: wl.customReportDomain.trim(),
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        resolved?: string[];
      };
      if (json.ok) {
        setVerifyStatus({ ok: true, message: "CNAME verified — custom report links are active." });
        onPreferencesChange(
          {
            ...preferences,
            whiteLabel: {
              ...wl,
              customReportDomain: wl.customReportDomain.trim(),
              customDomainVerified: true,
            },
          },
          "Custom report domain verified.",
        );
      } else {
        setVerifyStatus({
          ok: false,
          message:
            json.error ??
            `CNAME not found. Point ${wl.customReportDomain} to ${cnameTarget}.`,
        });
      }
    } catch {
      setVerifyStatus({ ok: false, message: "Could not verify DNS. Try again in a few minutes." });
    } finally {
      setVerifying(false);
    }
  }

  const locked = !isFleet;

  const dnsGuide = useMemo(
    () => cnameDnsHost(wl.customReportDomain.trim() || "reports.youragency.com"),
    [wl.customReportDomain],
  );

  function openLogoUpgrade() {
    upgradeModal?.openUpgradeModal({
      feature: "white_label_logo",
      title: "Upload your agency logo",
      description:
        "Fleet unlocks logo upload for proof reports, share links, and weekly digest emails.",
      plan: "fleet",
      unlocks: ["Logo on proof reports", "Custom brand colors", "White-label emails"],
    });
  }

  if (!isPilot && !isFleet) {
    return (
      <FeatureGate
        feature="white_label"
        plan="fleet"
        title="White-label client reports"
        description="Brand proof reports, share links, and weekly digests with your agency logo and colors."
        highlights={[
          "Logo upload + primary color",
          "Custom report domain (CNAME)",
          "Co-branded powered-by footer",
          "White-label digest emails",
        ]}
      />
    );
  }

  return (
    <div className="space-y-6">
      {locked && (
        <FeatureGate
          feature="white_label"
          plan="fleet"
          compact
          title="Fleet unlocks full white-label"
          description="Pilot includes agency name on reports. Upgrade to Fleet for logo upload, colors, custom domains, and branded emails."
          highlights={["Logo upload", "Custom CNAME", "Branded emails"]}
        />
      )}

      <label className="block text-sm font-semibold text-ink">
        Agency name
        <input
          type="text"
          value={wl.agencyName}
          disabled={togglesBusy}
          onChange={(e) => patchWhiteLabel({ agencyName: e.target.value }, true)}
          onBlur={() => onPreferencesChange(preferences, "Agency name saved.")}
          placeholder="Your agency or client brand"
          className={inputClass}
        />
      </label>

      <div>
        <p className="text-sm font-semibold text-ink">Logo</p>
        <p className="mt-1 text-xs text-muted">PNG or SVG, max 500KB. Shown in report headers.</p>
        {logoPreviewSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoPreviewSrc}
            alt="Agency logo preview"
            className="mt-3 h-10 max-w-[200px] object-contain object-left"
          />
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          {!locked ? (
            <>
              <input
                id={fileInputId}
                type="file"
                accept="image/png,image/svg+xml"
                className="sr-only"
                disabled={uploading || togglesBusy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadLogo(file);
                  e.target.value = "";
                }}
              />
              <label
                htmlFor={fileInputId}
                aria-disabled={uploading || togglesBusy}
                className={`inline-flex cursor-pointer items-center rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface ${
                  uploading || togglesBusy ? "pointer-events-none opacity-50" : ""
                }`}
              >
                {uploading ? "Uploading…" : "Upload logo"}
              </label>
            </>
          ) : (
            <button
              type="button"
              disabled={uploading || togglesBusy}
              onClick={openLogoUpgrade}
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface disabled:opacity-50"
            >
              Upload logo
            </button>
          )}
        </div>
      </div>

      <label className="block text-sm font-semibold text-ink">
        Primary color
        <div className="mt-2 flex items-center gap-3">
          <input
            type="color"
            value={normalizePrimaryColor(wl.primaryColor)}
            disabled={locked || togglesBusy}
            onChange={(e) => patchWhiteLabel({ primaryColor: e.target.value }, true)}
            onBlur={() => onPreferencesChange(preferences, "Brand color saved.")}
            className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-background p-1"
          />
          <input
            type="text"
            value={wl.primaryColor || DEFAULT_PRIMARY_COLOR}
            disabled={locked || togglesBusy}
            onChange={(e) => patchWhiteLabel({ primaryColor: e.target.value }, true)}
            onBlur={() =>
              patchWhiteLabel({ primaryColor: normalizePrimaryColor(wl.primaryColor) })
            }
            className={`${inputClass} mt-0 max-w-[140px]`}
          />
        </div>
      </label>

      <ul>
        <SettingsToggleRow
          id="settings-wl-powered-by"
          label='Custom “Powered by” (agency primary)'
          hint={
            locked
              ? "Fleet: footer reads “Powered by [Agency]” with small CitePilot technology credit"
              : "On: “Powered by [Agency]”. Off: “Powered by [Agency] via CitePilot”"
          }
          checked={wl.poweredByMode === "agency_primary"}
          disabled={locked || togglesBusy}
          onCheckedChange={(on) => {
            patchWhiteLabel({
              poweredByMode: on ? "agency_primary" : "agency_via_citepilot",
            });
          }}
        />
      </ul>

      <div className="rounded-xl border border-border bg-surface/40 p-4">
        <p className="text-sm font-semibold text-ink">Custom report domain</p>
        <p className="mt-1 text-xs text-muted">
          Optional CNAME for short links like{" "}
          <code className="rounded bg-background px-1">reports.youragency.com/r/abc123</code>
        </p>
        <label className="mt-3 block text-sm font-semibold text-ink">
          Your custom report domain
          <input
            type="text"
            value={wl.customReportDomain}
            disabled={locked || togglesBusy}
            onChange={(e) =>
              patchWhiteLabel(
                { customReportDomain: e.target.value, customDomainVerified: false },
                true,
              )
            }
            onBlur={() => onPreferencesChange(preferences)}
            placeholder="reports.youragency.com"
            className={inputClass}
          />
          <span className="mt-1.5 block text-xs font-normal text-muted">
            A subdomain you own — not <code className="rounded bg-background px-1">{cnameTarget}</code>.
            Example: <code className="rounded bg-background px-1">reports.youragency.com</code>
          </span>
        </label>
        <div className="mt-3 rounded-lg bg-background p-4 text-xs text-muted">
          <p className="font-semibold text-ink">DNS setup tutorial</p>
          <p className="mt-2 leading-relaxed">
            In your DNS provider (Cloudflare, GoDaddy, Namecheap, etc.), open the zone for{" "}
            <strong className="text-ink">{dnsGuide.zone}</strong> and add one CNAME record:
          </p>
          <dl className="mt-3 overflow-hidden rounded-lg border border-border text-left">
            <div className="grid grid-cols-[5.5rem_1fr] border-b border-border bg-surface/60">
              <dt className="border-r border-border px-3 py-2 font-semibold text-ink">Name</dt>
              <dd className="px-3 py-2 font-mono text-ink">{dnsGuide.host}</dd>
            </div>
            <div className="grid grid-cols-[5.5rem_1fr] border-b border-border">
              <dt className="border-r border-border px-3 py-2 font-semibold text-ink">Type</dt>
              <dd className="px-3 py-2 font-mono text-ink">CNAME</dd>
            </div>
            <div className="grid grid-cols-[5.5rem_1fr]">
              <dt className="border-r border-border px-3 py-2 font-semibold text-ink">Value</dt>
              <dd className="px-3 py-2 font-mono text-ink">{cnameTarget}</dd>
            </div>
          </dl>
          <ul className="mt-3 list-inside list-disc space-y-1.5 leading-relaxed">
            <li>
              <strong className="text-ink">Name</strong> is the subdomain part only — for{" "}
              <code className="rounded bg-surface px-1">{dnsGuide.fullDomain}</code>, enter{" "}
              <code className="rounded bg-surface px-1">{dnsGuide.host}</code> (not the full URL).
            </li>
            <li>
              Some providers label this field <strong className="text-ink">Host</strong> or{" "}
              <strong className="text-ink">Alias</strong>; a few want the full subdomain — check
              your provider&apos;s docs if verification fails.
            </li>
            <li>
              <strong className="text-ink">Value</strong> is always{" "}
              <code className="rounded bg-surface px-1">{cnameTarget}</code> — CitePilot&apos;s
              report server. Do not enter your own domain here.
            </li>
            <li>DNS can take 5–30 minutes to propagate (sometimes up to 24 hours).</li>
          </ul>
          {dnsGuide.isApex && (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-amber-950">
              Root domains (like <code>{dnsGuide.fullDomain}</code>) usually cannot use CNAME. Use a
              subdomain such as <code>reports.{dnsGuide.zone}</code> instead.
            </p>
          )}
          {wl.customReportDomain.trim().toLowerCase().replace(/\.$/, "") ===
            cnameTarget.toLowerCase() && (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50/80 px-3 py-2 text-red-800">
              <strong>{cnameTarget}</strong> is CitePilot&apos;s server — enter{" "}
              <em>your</em> subdomain above (e.g. reports.youragency.com), then point it here
              via CNAME.
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={locked || verifying || !wl.customReportDomain.trim()}
          onClick={() => void verifyDomain()}
          className="mt-3 rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface disabled:opacity-50"
        >
          {verifying ? "Checking DNS…" : "Verify CNAME"}
        </button>
        {verifyStatus ? (
          <p
            className={`mt-2 text-sm ${verifyStatus.ok ? "text-emerald-600" : "text-red-600"}`}
          >
            {verifyStatus.message}
          </p>
        ) : wl.customDomainVerified ? (
          <p className="mt-2 text-sm text-emerald-600">Custom domain verified</p>
        ) : null}
      </div>

      {isFleet && (
        <div className="rounded-xl border border-border bg-surface/40 p-4">
          <p className="text-sm font-semibold text-ink">White-label emails</p>
          <p className="mt-1 text-xs text-muted">
            Weekly digest From name, reply-to, and agency header/footer. Verify your sending domain
            in{" "}
            <a
              href="https://resend.com/domains"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              Resend → Domains
            </a>{" "}
            before using a custom From address.
          </p>
          <label className="mt-4 block text-sm font-semibold text-ink">
            From name
            <input
              type="text"
              value={wl.emailFromName}
              disabled={togglesBusy}
              onChange={(e) => patchWhiteLabel({ emailFromName: e.target.value }, true)}
              onBlur={() => onPreferencesChange(preferences, "Email branding saved.")}
              placeholder={wl.agencyName || "Your agency"}
              className={inputClass}
            />
          </label>
          <label className="mt-4 block text-sm font-semibold text-ink">
            Reply-to email
            <input
              type="email"
              value={wl.replyToEmail}
              disabled={togglesBusy}
              onChange={(e) => patchWhiteLabel({ replyToEmail: e.target.value }, true)}
              onBlur={() => onPreferencesChange(preferences, "Reply-to saved.")}
              placeholder="you@youragency.com"
              className={inputClass}
            />
          </label>
        </div>
      )}

      <div>
        <p className="text-sm font-semibold text-ink">Live preview</p>
        <p className="mt-1 text-xs text-muted">
          Preview uses your unsaved settings from this browser (not saved to the database until you
          blur a field or toggle).
        </p>
        <div className="mt-3 max-h-[520px] overflow-y-auto">
          <WhiteLabelProofPreview branding={previewState} embed />
        </div>
      </div>
    </div>
  );
}
