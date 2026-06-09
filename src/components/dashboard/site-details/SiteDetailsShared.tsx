"use client";

import Link from "next/link";

export function PrivacySettingsBlock() {
  return (
    <div className="rounded-xl border border-[#fce7f3] bg-[#fff1f2]/40 px-4 py-4">
      <p className="text-sm font-semibold text-[#0f172a]">
        Privacy Settings{" "}
        <Link
          href="/pricing"
          className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#fce7f3] px-2 py-0.5 text-[11px] font-bold text-[#db2777]"
        >
          ⚡ Upgrade plan
        </Link>
      </p>
      <p className="mt-1 text-sm text-[#64748b]">
        Configure white-label share links and proof report privacy on Fleet.{" "}
        <Link href="/dashboard/settings" className="font-medium text-[#0ea5e9]">
          Learn more
        </Link>
      </p>
    </div>
  );
}

export function SiteDetailsFooter({
  saving,
  onBack,
  onSave,
  onSaveContinue,
  continueLabel = "Save and Continue",
  showSave = true,
}: {
  saving?: boolean;
  onBack?: () => void;
  onSave?: () => void;
  onSaveContinue?: () => void;
  continueLabel?: string;
  showSave?: boolean;
}) {
  return (
    <footer className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-[#eef2f6] pt-6 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={onBack ?? (() => window.history.back())}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] px-5 py-2.5 text-sm font-semibold text-[#64748b] transition hover:bg-[#f8fafb] hover:text-[#0f172a]"
      >
        ← Back
      </button>
      <div className="flex flex-col gap-2 sm:flex-row">
        {showSave && onSave && (
          <button
            type="button"
            disabled={saving}
            onClick={onSave}
            className="rounded-xl border border-[#e2e8f0] px-5 py-2.5 text-sm font-semibold text-[#0f172a] transition hover:bg-[#f8fafb] disabled:opacity-60"
          >
            Save
          </button>
        )}
        {onSaveContinue && (
          <button
            type="button"
            disabled={saving}
            onClick={onSaveContinue}
            className="rounded-xl bg-[#0ea5e9] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(14,165,233,0.35)] transition hover:bg-[#0284c7] disabled:opacity-60"
          >
            {saving ? "Saving…" : continueLabel}
          </button>
        )}
      </div>
    </footer>
  );
}
