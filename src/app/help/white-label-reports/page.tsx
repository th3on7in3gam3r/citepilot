import { HelpPageLayout } from "@/components/help/HelpPageLayout";
import {
  contentSectionCard,
  contentSectionCardMuted,
  contentSectionTitle,
} from "@/lib/marketing/surface-classes";
import { reportsCnameTarget } from "@/lib/white-label/dns-guide";
import { site } from "@/lib/site";
import type { Metadata } from "next";

export const revalidate = 3600;

const CNAME_TARGET = reportsCnameTarget();

export const metadata: Metadata = {
  title: "White-Label Report Domain (CNAME) Setup",
  description: `How to point your agency subdomain (e.g. reports.youragency.com) to ${site.name} for branded proof report links.`,
};

const mistakes = [
  {
    wrong: "Adding the CNAME in getcitepilot.com DNS",
    right: "Add the CNAME in DNS for the domain you own (e.g. youragency.com in Cloudflare, Vercel, or GoDaddy).",
  },
  {
    wrong: `CNAME Value = reports.youragency.com (your own subdomain)`,
    right: `CNAME Value = ${CNAME_TARGET} (CitePilot's report server)`,
  },
  {
    wrong: "Entering reports.getcitepilot.com in CitePilot Settings",
    right: "Enter your subdomain in Settings, e.g. reports.youragency.com",
  },
] as const;

export default function WhiteLabelReportsHelpPage() {
  return (
    <HelpPageLayout
      eyebrow="Help · Fleet"
      title="White-label report domain (CNAME)"
      description={
        <>
          Fleet lets you serve proof report links on <strong>your</strong> subdomain
          — for example{" "}
          <code className="rounded bg-surface px-1 text-ink">
            reports.biblefunlandstudios.com
          </code>{" "}
          instead of getcitepilot.com. You configure this in two places: CitePilot
          Settings and your own domain&apos;s DNS. They are not the same thing.
        </>
      }
      actions={[
        {
          href: "/dashboard/settings",
          label: "Open Settings → White Label",
          primary: true,
        },
        { href: "/dashboard/help", label: "Help center" },
      ]}
    >
      <section className="content-section-gap grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800">
            Step 1 · In CitePilot
          </p>
          <p className="content-prose mt-3 text-ink">
            Go to <strong>Settings → White Label</strong> and enter{" "}
            <em>your</em> custom report subdomain:
          </p>
          <p className="mt-3 rounded-lg bg-card px-4 py-3 font-mono text-sm text-ink">
            reports.youragency.com
          </p>
          <p className="content-prose mt-3">
            Replace <code>youragency.com</code> with the domain you control. Do{" "}
            <strong>not</strong> enter <code>{CNAME_TARGET}</code> here — that is
            CitePilot&apos;s server, not yours.
          </p>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-900">
            Step 2 · In your DNS provider
          </p>
          <p className="content-prose mt-3 text-ink">
            Log in where you manage DNS for <strong>youragency.com</strong> (Vercel
            Domains, Cloudflare, GoDaddy, Namecheap, etc.). Add one CNAME record:
          </p>
          <dl className="mt-3 overflow-hidden rounded-lg border border-border bg-card text-sm">
            <div className="grid grid-cols-[5rem_1fr] border-b border-border">
              <dt className="border-r border-border px-3 py-2 font-semibold">Name</dt>
              <dd className="px-3 py-2 font-mono">reports</dd>
            </div>
            <div className="grid grid-cols-[5rem_1fr] border-b border-border">
              <dt className="border-r border-border px-3 py-2 font-semibold">Type</dt>
              <dd className="px-3 py-2 font-mono">CNAME</dd>
            </div>
            <div className="grid grid-cols-[5rem_1fr]">
              <dt className="border-r border-border px-3 py-2 font-semibold">Value</dt>
              <dd className="px-3 py-2 font-mono">{CNAME_TARGET}</dd>
            </div>
          </dl>
          <p className="content-prose mt-3">
            <strong>Name</strong> is only the subdomain part (<code>reports</code>).
            <strong> Value</strong> is always <code>{CNAME_TARGET}</code> — never your
            own domain.
          </p>
        </div>
      </section>

      <section className="content-section-gap rounded-2xl border border-red-200 bg-red-50/40 p-6 md:p-8">
        <h2 className={contentSectionTitle}>
          Common mistakes (and the errors they cause)
        </h2>
        <ul className="content-prose mt-4 space-y-4">
          {mistakes.map((item) => (
            <li
              key={item.wrong}
              className="rounded-xl border border-border bg-card p-4"
            >
              <p className="font-semibold text-red-700">✗ {item.wrong}</p>
              <p className="mt-2">
                <span className="font-semibold text-emerald-700">✓ Instead:</span>{" "}
                {item.right}
              </p>
            </li>
          ))}
        </ul>
        <p className="content-prose mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
          <strong>Vercel DNS error:</strong> &quot;The specified CNAME target cannot equal
          itself&quot; means you entered your own subdomain (e.g.{" "}
          <code>reports.youragency.com</code>) as the <strong>Value</strong>. Change
          Value to <code>{CNAME_TARGET}</code>.
        </p>
      </section>

      <section className={`content-section-gap ${contentSectionCard}`}>
        <h2 className={contentSectionTitle}>Example walkthrough</h2>
        <p className="content-prose mt-3">
          Agency domain: <code>biblefunlandstudios.com</code>, managed in Vercel Domains.
        </p>
        <ol className="content-prose mt-4 list-decimal space-y-3 pl-5">
          <li>
            In CitePilot Settings → White Label, enter{" "}
            <code className="text-ink">reports.biblefunlandstudios.com</code>
          </li>
          <li>
            In Vercel → Domains → biblefunlandstudios.com → DNS Records → Add: Name{" "}
            <code className="text-ink">reports</code>, Type{" "}
            <code className="text-ink">CNAME</code>, Value{" "}
            <code className="text-ink">{CNAME_TARGET}</code>
          </li>
          <li>Wait 5–30 minutes for DNS to propagate</li>
          <li>
            Back in CitePilot, click <strong>Verify CNAME</strong>
          </li>
        </ol>
        <p className="content-prose mt-4">
          After verification, share links look like{" "}
          <code className="rounded bg-surface px-1 text-ink">
            https://reports.biblefunlandstudios.com/r/abc123
          </code>
        </p>
      </section>

      <section className={`content-section-gap ${contentSectionCardMuted}`}>
        <h2 className={`${contentSectionTitle} text-lg`}>Still stuck?</h2>
        <p className="content-prose mt-2">
          Email{" "}
          <a href={`mailto:${site.supportEmail}`} className="font-semibold text-accent">
            {site.supportEmail}
          </a>{" "}
          with your domain, DNS provider, and a screenshot of the CNAME record you added.
        </p>
      </section>
    </HelpPageLayout>
  );
}
