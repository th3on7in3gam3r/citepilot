"use client";

import { useEffect, useState } from "react";
import {
  cleanDomainInput,
  domainFormatStatus,
} from "@/lib/onboarding/domain-validation";

type Reachability = "idle" | "checking" | "reachable" | "unreachable";

const REACHABILITY_TIMEOUT_MS = 10_000;

export type DomainInputStatus = "idle" | "invalid" | "checking" | "valid" | "unreachable";

function WarningIcon() {
  return (
    <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 00-.75.75v3.5a.75.75 0 001.5 0v-3.5A.75.75 0 0010 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-5 w-5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      className="h-5 w-5 animate-spin text-muted"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function OnboardingDomainInput({
  value,
  onChange,
  onStatusChange,
  onEnter,
}: {
  value: string;
  onChange: (value: string) => void;
  onStatusChange: (status: DomainInputStatus) => void;
  onEnter?: () => void;
}) {
  const [reachability, setReachability] = useState<Reachability>("idle");
  const format = domainFormatStatus(value);

  const status: DomainInputStatus =
    format === "empty"
      ? "idle"
      : format === "invalid"
        ? "invalid"
        : reachability === "checking"
          ? "checking"
          : reachability === "unreachable"
            ? "unreachable"
            : reachability === "reachable"
              ? "valid"
              : "checking";

  useEffect(() => {
    onStatusChange(status);
  }, [status, onStatusChange]);

  useEffect(() => {
    if (format !== "valid") {
      setReachability("idle");
      return;
    }

    const domain = cleanDomainInput(value);
    setReachability("checking");
    let cancelled = false;

    const debounceTimer = setTimeout(() => {
      const controller = new AbortController();
      const timeoutTimer = setTimeout(() => controller.abort(), REACHABILITY_TIMEOUT_MS);

      void fetch(`/api/domains/check?domain=${encodeURIComponent(domain)}`, {
        signal: controller.signal,
      })
        .then(async (res) => {
          if (cancelled) return;
          const data = (await res.json()) as { reachable?: boolean };
          setReachability(data.reachable ? "reachable" : "unreachable");
        })
        .catch(() => {
          if (!cancelled) setReachability("unreachable");
        })
        .finally(() => {
          clearTimeout(timeoutTimer);
        });
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(debounceTimer);
    };
  }, [value, format]);

  const borderClass =
    status === "invalid"
      ? "border-red-400 focus:border-red-400 focus:ring-red-400/15"
      : status === "unreachable"
        ? "border-amber-400 focus:border-amber-400 focus:ring-amber-400/15"
        : status === "valid"
          ? "border-emerald-400/70 focus:border-emerald-500 focus:ring-emerald-500/15"
          : "border-border focus:border-accent focus:ring-accent/15";

  const showTrailing = status !== "idle" && status !== "invalid";

  return (
    <div>
      <label htmlFor="onboarding-domain" className="sr-only">
        Website domain
      </label>
      <div className="relative">
        <input
          id="onboarding-domain"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="yourwebsite.com"
          autoComplete="url"
          spellCheck={false}
          required
          aria-required="true"
          className={`w-full rounded-full border bg-white py-4 pl-6 text-lg text-ink outline-none transition placeholder:text-muted/70 focus:ring-2 ${borderClass} ${
            showTrailing ? "pr-12" : "pr-6"
          }`}
          onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
          aria-invalid={status === "invalid"}
          aria-describedby={
            status === "invalid"
              ? "domain-error"
              : status === "unreachable"
                ? "domain-warning"
                : undefined
          }
        />
        {showTrailing && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
            {status === "checking" ? (
              <SpinnerIcon />
            ) : status === "unreachable" ? (
              <WarningIcon />
            ) : (
              <CheckIcon />
            )}
          </span>
        )}
      </div>

      {status === "invalid" && (
        <p id="domain-error" role="alert" className="mt-2 text-sm text-red-600">
          Enter a valid domain (e.g. yoursite.com)
        </p>
      )}
      {status === "unreachable" && (
        <p id="domain-warning" role="status" className="mt-2 text-sm text-amber-700">
          We&apos;ll still run the audit but some signals may be limited
        </p>
      )}
    </div>
  );
}
