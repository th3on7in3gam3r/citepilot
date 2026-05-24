"use client";

import { useState } from "react";

const questions = [
  { q: "What's your primary category?", options: ["B2B SaaS", "Agency", "Ecommerce"] },
  { q: "Who's your main competitor?", options: ["Competitor A", "Competitor B", "Other"] },
  { q: "Top buyer prompt?", options: ["Best tool for…", "Alternatives to…", "How to choose…"] },
];

export function PromptQuizMock() {
  const [step, setStep] = useState(0);
  const current = questions[step % questions.length];

  return (
    <div className="glass-light w-full overflow-hidden rounded-3xl">
      <div className="border-b border-border bg-cream px-6 py-4">
        <p className="text-sm font-semibold text-ink">Configure your audit</p>
        <p className="text-xs text-muted">Step {step + 1} of {questions.length}</p>
      </div>
      <div className="p-6">
        <p className="font-display text-lg font-bold text-ink">{current.q}</p>
        <div className="mt-4 space-y-2">
          {current.options.map((opt, i) => (
            <button
              key={opt}
              type="button"
              onClick={() => setStep((s) => (s + 1) % questions.length)}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition ${
                i === 0
                  ? "border-accent bg-accent/10 font-semibold text-accent-deep"
                  : "border-border bg-white text-muted hover:border-accent/40"
              }`}
            >
              {opt}
              {i === 0 && <span className="text-accent">✓</span>}
            </button>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-muted">Tap to preview next step</p>
      </div>
    </div>
  );
}
