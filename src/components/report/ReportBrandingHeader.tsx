import type { WorkspacePreferences } from "@/lib/settings";

export function ReportBrandingHeader({
  whiteLabel,
  domain,
  subtitle,
}: {
  whiteLabel: WorkspacePreferences["whiteLabel"];
  domain: string;
  subtitle: string;
}) {
  const agencyName =
    whiteLabel.agencyName.trim() ||
    domain.split(".")[0] ||
    "Stakeholder report";

  return (
    <div>
      {whiteLabel.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={whiteLabel.logoUrl}
          alt={agencyName}
          className="h-10 max-w-[220px] object-contain object-left"
        />
      ) : (
        <p className="font-display text-xl font-bold text-ink">{agencyName}</p>
      )}
      <p className="mt-1 text-sm text-muted">{subtitle}</p>
    </div>
  );
}

export function ReportPoweredByFooter({
  hidePoweredBy,
}: {
  hidePoweredBy: boolean;
}) {
  if (hidePoweredBy) return null;
  return (
    <footer className="mt-12 border-t border-border pt-6 text-center text-xs text-muted print:mt-8">
      Report generated with CitePilot
    </footer>
  );
}
