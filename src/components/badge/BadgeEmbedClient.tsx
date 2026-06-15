"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useToast } from "@/components/notifications/ToastProvider";
import { site } from "@/lib/site";

type Props = {
  domain: string;
};

function CopyBlock({
  label,
  code,
  language,
}: {
  label: string;
  code: string;
  language: string;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">{label}</p>
        <button
          type="button"
          onClick={() => void copy()}
          className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted transition hover:border-accent/40 hover:text-ink"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto rounded-xl bg-surface p-3 text-xs leading-relaxed text-ink">
        <code>{code}</code>
      </pre>
      <p className="mt-2 text-[11px] text-muted">{language}</p>
    </div>
  );
}

export function BadgeEmbedClient({ domain }: Props) {
  const base = site.url.replace(/\/$/, "");
  const encodedDomain = encodeURIComponent(domain);
  const badgeUrl = `${base}/api/widget/score/${encodedDomain}`;
  const auditUrl = `${base}/audit?ref=badge&domain=${encodedDomain}`;

  const snippets = useMemo(
    () => ({
      html: `<a href="${auditUrl}" target="_blank" rel="noopener noreferrer">
  <img src="${badgeUrl}" alt="GEO Score by CitePilot" width="200" height="32" />
</a>`,
      markdown: `[![GEO Score](${badgeUrl})](${auditUrl})`,
      script: `<script src="${base}/widget.js" data-domain="${domain}"></script>`,
    }),
    [auditUrl, badgeUrl, base, domain],
  );

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-muted">Live preview</p>
        <div className="mt-4 flex flex-wrap items-center gap-6">
          <img
            src={badgeUrl}
            alt={`GEO Score for ${domain}`}
            width={200}
            height={32}
            className="h-auto max-w-full"
          />
          <img
            src={`${badgeUrl}?style=shield`}
            alt={`GEO Score shield for ${domain}`}
            width={120}
            height={140}
            className="h-auto"
          />
          <img
            src={`${badgeUrl}?style=badge`}
            alt={`GEO Score badge for ${domain}`}
            width={168}
            height={36}
            className="h-auto"
          />
        </div>
        <p className="mt-4 text-xs text-muted">
          Styles: add <code className="rounded bg-surface px-1">?style=flat</code>,{" "}
          <code className="rounded bg-surface px-1">?style=shield</code>, or{" "}
          <code className="rounded bg-surface px-1">?style=badge</code> to the image URL.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-1">
        <CopyBlock label="HTML img tag" code={snippets.html} language="Paste in your site footer or sidebar" />
        <CopyBlock label="Markdown" code={snippets.markdown} language="GitHub README, Notion, docs" />
        <CopyBlock
          label="Framer / Webflow snippet"
          code={snippets.script}
          language="Floating badge — bottom-right corner with hover details"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard"
          className="inline-flex rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-accent/40"
        >
          ← Back to dashboard
        </Link>
        <a
          href={auditUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-deep"
        >
          Preview CTA link →
        </a>
      </div>
    </div>
  );
}
