import { apiDocsSections } from "@/lib/marketing/api-docs-content";

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-glow"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function renderTable(lines: string[]) {
  const rows = lines
    .filter((l) => l.trim().startsWith("|"))
    .map((l) =>
      l
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim()),
    );
  if (rows.length < 2) return null;
  const [header, , ...body] = rows;

  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full min-w-[280px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.04]">
            {header.map((cell) => (
              <th
                key={cell}
                className="px-4 py-2.5 font-semibold text-white/70"
              >
                {renderInline(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} className="border-b border-white/5 last:border-0">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="px-4 py-2.5 text-white/60"
                >
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderBody(body: string) {
  const segments = body.split(/(```[\s\S]*?```)/g);

  return segments.map((segment, si) => {
    if (segment.startsWith("```")) {
      const code = segment.replace(/^```\w*\n?/, "").replace(/```$/, "");
      return (
        <pre
          key={si}
          className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-xs leading-relaxed text-white/80"
        >
          <code>{code.trimEnd()}</code>
        </pre>
      );
    }

    const blocks = segment.split(/\n\n+/);
    return blocks.map((block, bi) => {
      const lines = block.split("\n");
      if (lines.every((l) => l.trim().startsWith("|"))) {
        return <div key={`${si}-${bi}`}>{renderTable(lines)}</div>;
      }
      if (lines.length === 1 && lines[0].startsWith("**") && lines[0].endsWith("**")) {
        return (
          <p key={`${si}-${bi}`} className="mt-4 font-mono text-sm text-glow">
            {renderInline(lines[0])}
          </p>
        );
      }
      return (
        <p
          key={`${si}-${bi}`}
          className="mt-4 text-sm leading-relaxed text-white/65"
        >
          {lines.map((line, li) => (
            <span key={li}>
              {li > 0 && <br />}
              {renderInline(line)}
            </span>
          ))}
        </p>
      );
    });
  });
}

export function ApiDocsContent() {
  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-10 flex flex-wrap gap-2">
        {apiDocsSections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-white/60 transition hover:border-accent/40 hover:text-white"
          >
            {s.title}
          </a>
        ))}
      </nav>

      {apiDocsSections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className="scroll-mt-24 border-b border-white/10 py-10 last:border-0"
        >
          <h2 className="font-display text-xl font-bold text-white">
            {section.title}
          </h2>
          <div>{renderBody(section.body)}</div>
        </section>
      ))}
    </div>
  );
}
