"use client";

import { useEffect, useRef } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-json";

type CodeBlockProps = {
  code: string;
  language: "bash" | "javascript" | "python" | "json";
  title?: string;
};

export function CodeBlock({ code, language, title }: CodeBlockProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current) Prism.highlightElement(ref.current);
  }, [code, language]);

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border bg-[#0d1117] dark:border-[#30363d]">
      {title && (
        <div className="border-b border-[#30363d] px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#8b949e]">
          {title}
        </div>
      )}
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
        <code ref={ref} className={`language-${language}`}>
          {code.trimEnd()}
        </code>
      </pre>
    </div>
  );
}
