"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useToast } from "@/components/notifications/ToastProvider";
import type { BadgeStyle, BadgeTheme } from "@/lib/widget/geo-badge";
import { site } from "@/lib/site";

type Props = {
  domain: string;
};

const STYLES: { id: BadgeStyle; label: string; hint: string }[] = [
  { id: "flat", label: "Flat", hint: "Inline pill for footers" },
  { id: "shield", label: "Shield", hint: "Hero mark for sidebars" },
  { id: "badge", label: "Badge", hint: "Compact card chip" },
];

function buildScoreUrl(
  base: string,
  domain: string,
  style: BadgeStyle,
  theme: BadgeTheme,
): string {
  const url = new URL(`${base}/api/widget/score/${encodeURIComponent(domain)}`);
  if (style !== "flat") url.searchParams.set("style", style);
  if (theme !== "dark") url.searchParams.set("theme", theme);
  return url.toString();
}

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
  const [style, setStyle] = useState<BadgeStyle>("flat");
  const [theme, setTheme] = useState<BadgeTheme>("dark");

  const badgeUrl = useMemo(
    () => buildScoreUrl(base, domain, style, theme),
    [base, domain, style, theme],
  );
  const auditUrl = `${base}/audit?ref=badge&domain=${encodeURIComponent(domain)}`;

  const previewUrls = useMemo(
    () =>
      STYLES.map((s) => ({
        ...s,
        src: buildScoreUrl(base, domain, s.id, theme),
      })),
    [base, domain, theme],
  );

  const imgSize =
    style === "shield"
      ? { width: 112, height: 132 }
      : style === "badge"
        ? { width: 176, height: 36 }
        : { width: 170, height: 28 };

  const snippets = useMemo(
    () => ({
      html: `<a href="${auditUrl}" target="_blank" rel="noopener noreferrer">
  <img src="${badgeUrl}" alt="GEO Score by CitePilot" width="${imgSize.width}" height="${imgSize.height}" />
</a>`,
      markdown: `[![GEO Score](${badgeUrl})](${auditUrl})`,
      script: `<script src="${base}/widget.js" data-domain="${domain}"></script>`,
    }),
    [auditUrl, badgeUrl, base, domain, imgSize.height, imgSize.width],
  );

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-ink">Live preview</p>
          <div
            className="inline-flex rounded-full border border-border bg-surface p-0.5"
            role="group"
            aria-label="Badge theme"
          >
            {(["dark", "light"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                aria-pressed={theme === t}
                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${
                  theme === t
                    ? "bg-ink text-white"
                    : "text-muted hover:text-ink"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div
          className={`mt-5 flex min-h-[160px] items-center justify-center rounded-xl border border-dashed border-border p-8 ${
            theme === "light" ? "bg-slate-900" : "bg-surface"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- live SVG from widget API */}
          <img
            key={badgeUrl}
            src={badgeUrl}
            alt={`GEO Score ${style} preview for ${domain}`}
            width={imgSize.width}
            height={imgSize.height}
            className="h-auto max-w-full"
          />
        </div>

        <p className="mt-5 text-xs font-medium uppercase tracking-wide text-muted">
          Choose a style
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {previewUrls.map((s) => {
            const selected = style === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setStyle(s.id)}
                aria-pressed={selected}
                aria-label={`Select ${s.label} style`}
                className={`flex flex-col items-center gap-3 rounded-xl border p-4 text-left transition ${
                  selected
                    ? "border-accent bg-accent/5 ring-2 ring-accent/30"
                    : "border-border bg-surface hover:border-accent/40"
                }`}
              >
                <div
                  className={`flex h-24 w-full items-center justify-center rounded-lg ${
                    theme === "light" ? "bg-slate-900" : "bg-card"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.src}
                    alt=""
                    width={s.id === "shield" ? 72 : 140}
                    height={s.id === "shield" ? 84 : 28}
                    className="h-auto max-h-20 max-w-full"
                  />
                </div>
                <div className="w-full">
                  <p className="text-sm font-semibold text-ink">{s.label}</p>
                  <p className="mt-0.5 text-[11px] text-muted">{s.hint}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4">
        <CopyBlock
          label="HTML img tag"
          code={snippets.html}
          language="Paste in your site footer or sidebar — updates with your style & theme"
        />
        <CopyBlock
          label="Markdown"
          code={snippets.markdown}
          language="GitHub README, Notion, docs"
        />
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
