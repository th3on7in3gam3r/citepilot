"use client";

import Link from "next/link";
import { CodeBlock } from "@/components/docs/CodeBlock";
import {
  apiDocsSections,
  type ApiDocsEndpoint,
  type ApiDocsSection,
} from "@/lib/marketing/api-docs-data";

function MethodBadge({ method }: { method: ApiDocsEndpoint["method"] }) {
  const colors = {
    GET: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    POST: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    DELETE: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  };
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold ${colors[method]}`}
    >
      {method}
    </span>
  );
}

function EndpointCard({ endpoint }: { endpoint: ApiDocsEndpoint }) {
  return (
    <article className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-center gap-3">
        <MethodBadge method={endpoint.method} />
        <code className="font-mono text-sm text-glow">{endpoint.path}</code>
        {endpoint.status === "planned" && (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
            Planned
          </span>
        )}
      </div>
      <h4 className="mt-3 font-display text-base font-semibold text-white">
        {endpoint.title}
      </h4>
      <p className="mt-2 text-sm leading-relaxed text-white/65">
        {endpoint.description}
      </p>
      {endpoint.requestBody && (
        <>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-white/45">
            Request body
          </p>
          <CodeBlock code={endpoint.requestBody} language="json" />
        </>
      )}
      {endpoint.responseExample && (
        <>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-white/45">
            Example response
          </p>
          <CodeBlock code={endpoint.responseExample} language="json" />
        </>
      )}
      {endpoint.samples && (
        <div className="mt-4 space-y-1">
          <CodeBlock code={endpoint.samples.curl} language="bash" title="cURL" />
          <CodeBlock code={endpoint.samples.node} language="javascript" title="Node.js" />
          <CodeBlock code={endpoint.samples.python} language="python" title="Python" />
        </div>
      )}
    </article>
  );
}

function SectionContent({ section }: { section: ApiDocsSection }) {
  return (
    <section id={section.id} className="scroll-mt-28 border-b border-white/10 py-10 last:border-0">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-2xl font-bold text-white">{section.title}</h2>
        {section.badge === "coming-soon" && (
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-200">
            Coming soon
          </span>
        )}
      </div>
      {section.intro && (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">
          {section.intro}
        </p>
      )}
      {section.id === "authentication" && (
        <>
          <CodeBlock
            code={`Authorization: Bearer ck_live_xxxxxxxxxxxx\nContent-Type: application/json`}
            language="bash"
            title="Headers"
          />
          <p className="mt-3 text-sm text-white/60">
            Alternative: <code className="text-glow">X-API-Key: ck_live_…</code> header.
            Session cookies work for browser testing with credentials included.
          </p>
        </>
      )}
      {section.body && (
        <p className="mt-3 text-sm leading-relaxed text-white/65">{section.body}</p>
      )}
      {section.samples && (
        <div className="mt-4">
          <CodeBlock code={section.samples.curl} language="bash" title="cURL" />
          <CodeBlock code={section.samples.node} language="javascript" title="Node.js" />
          <CodeBlock code={section.samples.python} language="python" title="Python" />
        </div>
      )}
      {section.bullets && (
        <ul className="mt-4 space-y-2 text-sm text-white/65">
          {section.bullets.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-accent">•</span>
              {item}
            </li>
          ))}
        </ul>
      )}
      {section.table && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.04]">
                {section.table.headers.map((h) => (
                  <th key={h} className="px-4 py-2.5 font-semibold text-white/70">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.table.rows.map((row, ri) => (
                <tr key={ri} className="border-b border-white/5 last:border-0">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-2.5 text-white/60">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {section.jsonExample && (
        <CodeBlock code={section.jsonExample} language="json" title="Error shape" />
      )}
      {section.endpoints?.map((endpoint) => (
        <EndpointCard key={`${endpoint.method}-${endpoint.path}`} endpoint={endpoint} />
      ))}
    </section>
  );
}

export function ApiDocsPageContent() {
  return (
    <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
      <aside className="lg:sticky lg:top-24 lg:w-56 lg:shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/45">
          On this page
        </p>
        <nav className="mt-3 flex flex-row flex-wrap gap-2 lg:flex-col lg:gap-1">
          {apiDocsSections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="rounded-lg px-3 py-2 text-sm text-white/60 transition hover:bg-white/5 hover:text-white lg:block"
            >
              {section.title}
              {section.badge === "coming-soon" && (
                <span className="ml-1 text-[10px] text-amber-300/80">soon</span>
              )}
            </a>
          ))}
        </nav>
        <div className="mt-8 hidden rounded-xl border border-accent/25 bg-accent/5 p-4 lg:block">
          <p className="text-xs font-semibold text-accent">Fleet required</p>
          <p className="mt-1 text-xs leading-relaxed text-white/55">
            Generate keys in{" "}
            <Link href="/dashboard/settings" className="text-glow hover:underline">
              Dashboard → Settings → Fleet
            </Link>
            .
          </p>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {apiDocsSections.map((section) => (
          <SectionContent key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}
