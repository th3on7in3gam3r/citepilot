"use client";

import { useState } from "react";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { useWorkspaceSwitcher } from "@/contexts/WorkspaceSwitcherContext";
import { runAudit } from "@/lib/client/api";
import { useToast } from "@/components/notifications/ToastProvider";

const CATEGORIES = [
  { value: "b2b-saas", label: "B2B SaaS" },
  { value: "agency", label: "Agency" },
  { value: "ecommerce", label: "Ecommerce" },
  { value: "local", label: "Local" },
  { value: "other", label: "Other" },
] as const;

export function WorkspaceCreationWizard() {
  const { wizardOpen, setWizardOpen } = useWorkspaceSwitcher();
  const { createClientWorkspace, refresh } = useWorkspaceContext();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [domain, setDomain] = useState("");
  const [domainError, setDomainError] = useState("");
  const [category, setCategory] = useState("b2b-saas");
  const [promptsText, setPromptsText] = useState("");
  const [busy, setBusy] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  function reset() {
    setStep(0);
    setDomain("");
    setDomainError("");
    setCategory("b2b-saas");
    setPromptsText("");
    setCreatedId(null);
  }

  function close() {
    setWizardOpen(false);
    reset();
  }

  async function validateDomain(): Promise<boolean> {
    const trimmed = domain.trim();
    if (!trimmed) {
      setDomainError("Domain is required");
      return false;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/workspaces/check-domain", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: trimmed }),
      });
      const data = (await res.json()) as { available?: boolean; error?: string };
      if (!res.ok || !data.available) {
        if (res.status === 401) {
          setDomainError(
            "Session not recognized — refresh the page, then try again. If it persists, sign out and back in.",
          );
          return false;
        }
        setDomainError(
          data.available === false
            ? "You already have a workspace for this domain"
            : data.error ?? "Invalid domain",
        );
        return false;
      }
      setDomainError("");
      return true;
    } finally {
      setBusy(false);
    }
  }

  async function createWorkspace() {
    const prompts = promptsText
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);
    const buyerQuestion = prompts[0] ?? "";
    if (!buyerQuestion) {
      toast.error("Add at least one money prompt");
      return;
    }

    setBusy(true);
    const result = await createClientWorkspace({
      domain: domain.trim(),
      buyerQuestion,
      description: `${category} client workspace`,
      businessType: category,
    });
    if (result.error) {
      toast.error(result.error);
      setBusy(false);
      return;
    }
    const id = result.id;
    setCreatedId(id ?? null);

    if (id && prompts.length > 0) {
      await fetch(`/api/workspaces/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences: { monitoredPrompts: prompts },
        }),
      }).catch(() => undefined);
    }

    setBusy(false);
    setStep(3);
    await refresh();
  }

  async function launchScan() {
    if (!createdId) return;
    setBusy(true);
    try {
      const prompts = promptsText
        .split("\n")
        .map((p) => p.trim())
        .filter(Boolean);
      await runAudit({
        domain: domain.trim(),
        prompts,
        workspaceId: createdId,
      });
      toast.success("First scan launched — results in ~60 seconds");
      close();
    } catch {
      toast.error("Failed to launch scan");
    } finally {
      setBusy(false);
    }
  }

  if (!wizardOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={close}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex justify-center gap-2">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full ${
                i <= step ? "bg-accent" : "bg-border"
              }`}
            />
          ))}
        </div>

        {step === 0 && (
          <>
            <h2 className="font-display text-lg font-bold text-ink">Client domain</h2>
            <p className="mt-1 text-sm text-muted">Enter the site you want to track.</p>
            <input
              type="text"
              value={domain}
              onChange={(e) => {
                setDomain(e.target.value);
                setDomainError("");
              }}
              placeholder="client.com"
              className="mt-4 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm"
            />
            {domainError && (
              <p className="mt-2 text-xs font-semibold text-red-600">{domainError}</p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={close} className="rounded-xl px-4 py-2 text-sm">
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void validateDomain().then((ok) => ok && setStep(1))}
                className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="font-display text-lg font-bold text-ink">Category</h2>
            <p className="mt-1 text-sm text-muted">Helps tailor audits and reports.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`rounded-xl border px-3 py-3 text-sm font-semibold ${
                    category === c.value
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-ink hover:bg-surface"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-between">
              <button type="button" onClick={() => setStep(0)} className="text-sm text-muted">
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white"
              >
                Next →
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="font-display text-lg font-bold text-ink">Money prompts</h2>
            <p className="mt-1 text-sm text-muted">One per line — or paste from CSV.</p>
            <textarea
              rows={6}
              value={promptsText}
              onChange={(e) => setPromptsText(e.target.value)}
              placeholder={`best CRM for startups\n${domain.trim() || "client.com"} alternatives`}
              className="mt-4 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm"
            />
            <div className="mt-6 flex justify-between">
              <button type="button" onClick={() => setStep(1)} className="text-sm text-muted">
                ← Back
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void createWorkspace()}
                className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? "Creating…" : "Create workspace →"}
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="font-display text-lg font-bold text-ink">Ready to scan</h2>
            <p className="mt-1 text-sm text-muted">
              Launch a citation audit for <strong>{domain}</strong> now?
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void launchScan()}
                className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? "Launching…" : "Launch first scan →"}
              </button>
              <button type="button" onClick={close} className="w-full py-2 text-sm text-muted">
                Skip for now
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
