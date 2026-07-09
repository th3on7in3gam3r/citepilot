import Link from "next/link";
import { BIBLEFUNLAND_STUDIOS_URL, GROWTH_STACK, aiCmoAppHref } from "@/lib/growth-stack";

const cards = [
  { key: "kerygma" as const, border: "border-accent/25 hover:border-accent/50" },
  { key: "aiCmo" as const, border: "border-white/10 hover:border-white/25" },
  { key: "aegis" as const, border: "border-mint/20 hover:border-mint/40" },
];

export function GrowthStackPromo() {
  return (
    <section className="border-y border-border bg-surface py-16 dark:border-white/10 dark:bg-[#0a0c12]">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
          Growth stack
        </p>
        <h2 className="font-display mt-3 max-w-2xl text-2xl font-bold tracking-tight text-ink md:text-3xl dark:text-white">
          Citations are step one — publish and secure what you build next
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted dark:text-white/60">
          CitePilot tracks AI visibility. Sister products from{" "}
          <a
            href={BIBLEFUNLAND_STUDIOS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent underline decoration-accent/30 underline-offset-2 hover:decoration-accent/60"
          >
            Bible Funland Studios
          </a>{" "}
          help you create campaigns, run social on autopilot, and ship secure code.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {cards.map(({ key, border }) => {
            const product = GROWTH_STACK[key];
            const href =
              key === "kerygma"
                ? GROWTH_STACK.kerygma.href
                : key === "aiCmo"
                  ? aiCmoAppHref()
                  : GROWTH_STACK.aegis.href;
            return (
              <Link
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`rounded-2xl border bg-white p-6 transition dark:bg-white/[0.03] ${border}`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted dark:text-white/45">
                  Sister product
                </p>
                <h3 className="mt-2 text-lg font-semibold text-ink dark:text-white">{product.name}</h3>
                <p className="mt-2 text-sm text-muted dark:text-white/55">{product.tagline}</p>
                <span className="mt-4 inline-block text-sm font-semibold text-accent">Learn more →</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
