"use client";

import { useEffect, useRef } from "react";
import { PilotCheckoutButton } from "@/components/billing/PilotCheckoutButton";
import type { UpgradeModalRequest } from "@/contexts/UpgradeModalContext";

type UpgradeModalProps = {
  open: boolean;
  request: UpgradeModalRequest;
  onDismiss: () => void;
  onCheckoutClick: () => void;
};

export function UpgradeModal({
  open,
  request,
  onDismiss,
  onCheckoutClick,
}: UpgradeModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const plan = request.plan ?? "pilot";
  const priceLabel = plan === "fleet" ? "Start Fleet — $249/mo" : "Start Pilot — $79/mo";

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-[80] m-0 flex h-full max-h-none w-full max-w-none items-center justify-center border-0 bg-black/50 p-4"
      onClose={onDismiss}
    >
      <div
        className="mx-auto w-full max-w-md"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-xl dark:border-[#222]">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            {plan === "fleet" ? "Fleet" : "Pilot"} feature
          </p>
          <h2 className="font-display mt-2 text-xl font-bold text-foreground">
            {request.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {request.description}
          </p>
          {request.unlocks && request.unlocks.length > 0 && (
            <ul className="mt-4 space-y-2 text-sm text-foreground/90">
              {request.unlocks.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-accent" aria-hidden>
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6 space-y-2">
            <div onClick={onCheckoutClick}>
              <PilotCheckoutButton
                plan={plan}
                signedIn
                variant="accent"
                feature={request.feature}
                source="modal"
              >
                <span className="px-1">{priceLabel}</span>
              </PilotCheckoutButton>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="w-full rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-muted transition hover:bg-surface hover:text-foreground"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
