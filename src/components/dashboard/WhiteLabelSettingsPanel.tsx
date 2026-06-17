"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FeatureGate } from "@/components/billing/FeatureGate";
import { SettingsToggleRow } from "@/components/dashboard/SettingsToggleRow";
import { WhiteLabelProofPreview } from "@/components/report/WhiteLabelProofPreview";
import { useToast } from "@/components/notifications/ToastProvider";
import { useUpgradeModalOptional } from "@/contexts/UpgradeModalContext";
import type { WorkspacePreferences } from "@/lib/settings";
import {
  DEFAULT_PRIMARY_COLOR,
  WHITE_LABEL_PREVIEW_KEY,
  type WhiteLabelPreviewState,
} from "@/lib/white-label/types";
import { normalizePrimaryColor, logoSrcForWorkspace } from "@/lib/white-label/theme";
import { cnameDnsHost } from "@/lib/white-label/dns-guide";
import { upgradeModalCooldownActive } from "@/lib/upgrade/modal-cooldown";

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
  const [logoCacheKey, setLogoCacheKey] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const upgradeModal = useUpgradeModalOptional();
  const toast = useToast();

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
    let src = trimmed;
    if (src.includes("/api/white-label/logo") && !src.includes("workspaceId=")) {
      src = logoSrcForWorkspace(workspaceId, "");
    }
    if (logoCacheKey > 0) {
      const joiner = src.includes("?") ? "&" : "?";
      return `${src}${joiner}v=${logoCacheKey}`;
    }
    return src;
  }, [wl.logoUrl, workspaceId, logoCacheKey]);

  function openFilePicker() {
    fileRef.current?.click();
  }

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
      const nextWl = { ...wl, logoUrl: json.logoUrl };
      const next = { ...preferences, whiteLabel: nextWl };
      onPreferencesDraft(next);
      syncPreview(next);
      setLogoCacheKey(Date.now());
      onPreferencesChange(next, "Logo uploaded.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Logo upload failed";
      toast.error(message);
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
    if (upgradeModalCooldownActive()) {
      toast.info("Upgrade prompt was dismissed recently. Visit Pricing to compare Fleet plans.");
      return;
    }
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
            onError={() => setLogoCacheKey(0)}
          />
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/svg+xml,.png,.svg"
            className="hidden"
            disabled={locked || uploading || togglesBusy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadLogo(file);
              e.target.value = "";
            }}
          />
          {!locked ? (
            <button
              type="button"
              disabled={uploading || togglesBusy}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openFilePicker();
              }}
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Upload logo"}
            </button>
          ) : (
            <button
              type="button"
              disabled={uploading || togglesBusy}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openLogoUpgrade();
              }}
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

      <div id="white-label-dns" className="rounded-xl border border-border bg-surface/40 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-sm font-semibold text-ink">Custom report domain</p>
          <Link
            href="/help/white-label-reports"
            className="text-xs font-semibold text-accent hover:underline"
          >
            Full DNS guide →
          </Link>
        </div>
        <p className="mt-1 text-xs text-muted">
          Optional branded links like{" "}
          <code className="rounded bg-background px-1">reports.youragency.com/r/abc123</code>
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/50 p-3 text-xs">
            <p className="font-semibold uppercase tracking-wide text-emerald-900">
              Step 1 · Here in CitePilot
            </p>
            <p className="mt-2 text-muted">
              Enter <strong className="text-ink">your</strong> subdomain below (a domain you
              own):
            </p>
            <p className="mt-2 font-mono text-ink">
              reports.{dnsGuide.zone === dnsGuide.fullDomain ? "youragency.com" : dnsGuide.zone}
            </p>
          </div>
          <div className="rounded-lg border border-sky-200/80 bg-sky-50/50 p-3 text-xs">
            <p className="font-semibold uppercase tracking-wide text-sky-900">
              Step 2 · Your DNS provider
            </p>
            <p className="mt-2 text-muted">
              In DNS for <strong className="text-ink">{dnsGuide.zone}</strong> (Vercel, Cloudflare,
              GoDaddy — <em>not</em> getcitepilot.com), add a CNAME pointing to CitePilot:
            </p>
            <p className="mt-2 font-mono text-ink">{cnameTarget}</p>
          </div>
        </div>

        <label className="mt-4 block text-sm font-semibold text-ink">
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
            Example for you:{" "}
            <code className="rounded bg-background px-1">
              reports.{dnsGuide.zone === dnsGuide.fullDomain ? "youragency.com" : dnsGuide.zone}
            </code>{" "}
            — never <code className="rounded bg-background px-1">{cnameTarget}</code>
          </span>
        </label>

        <div className="mt-3 rounded-lg bg-background p-4 text-xs text-muted">
          <p className="font-semibold text-ink">DNS record to add (in your domain&apos;s DNS)</p>
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

          <div className="mt-3 rounded-lg border border-red-200 bg-red-50/80 px-3 py-2.5 text-red-900">
            <p className="font-semibold">Common mistake</p>
            <p className="mt-1 leading-relaxed">
              Do <strong>not</strong> set Value to{" "}
              <code className="rounded bg-white/80 px-1">{dnsGuide.fullDomain}</code> (your domain).
              That points the record to itself — Vercel shows &quot;CNAME target cannot equal
              itself.&quot; Value must always be{" "}
              <code className="rounded bg-white/80 px-1">{cnameTarget}</code>.
            </p>
          </div>

          <ul className="mt-3 list-inside list-disc space-y-1.5 leading-relaxed">
            <li>
              <strong className="text-ink">Name</strong> = subdomain part only (
              <code className="rounded bg-surface px-1">{dnsGuide.host}</code>)
            </li>
            <li>
              <strong className="text-ink">Value</strong> = always{" "}
              <code className="rounded bg-surface px-1">{cnameTarget}</code> (CitePilot — same for
              every customer)
            </li>
            <li>DNS changes go in the DNS panel for your domain, not in getcitepilot.com</li>
            <li>Propagation usually takes 5–30 minutes</li>
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
              <strong>{cnameTarget}</strong> belongs in the DNS <em>Value</em> field only — enter
              your subdomain above (e.g. reports.{dnsGuide.zone}).
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
