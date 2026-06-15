import { customerMarqueeNames } from "@/lib/marketing/customer-marquee";

function MarqueeRow({
  names,
  reverse = false,
}: {
  names: readonly string[];
  reverse?: boolean;
}) {
  const track = [...names, ...names];

  return (
    <div className="customer-marquee-row overflow-hidden motion-reduce:hidden">
      <div
        className={`customer-marquee-track flex w-max items-center gap-10 md:gap-14 ${
          reverse ? "customer-marquee-track--reverse" : ""
        }`}
        aria-hidden
      >
        {track.map((name, i) => (
          <span
            key={`${name}-${i}`}
            className="shrink-0 font-display text-base font-semibold tracking-tight text-ink/35 dark:text-white/30 md:text-lg"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

export function CustomerLogosBar() {
  const firstRow = customerMarqueeNames.slice(0, 6);
  const secondRow = customerMarqueeNames.slice(6);

  return (
    <section
      className="border-b border-border bg-cream py-8 dark:bg-background md:py-10"
      aria-label="Trusted by teams using CitePilot"
    >
      <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        Trusted by teams at
      </p>

      <div className="customer-marquee-mask relative mt-6 space-y-4 motion-reduce:hidden md:mt-8 md:space-y-5">
        <MarqueeRow names={firstRow} />
        <MarqueeRow names={secondRow} reverse />
      </div>

      <ul className="mt-6 hidden flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 motion-reduce:flex md:gap-x-10">
        {customerMarqueeNames.map((name) => (
          <li
            key={name}
            className="font-display text-base font-semibold tracking-tight text-ink/35 dark:text-white/30 md:text-lg"
          >
            {name}
          </li>
        ))}
      </ul>

      {/* TODO: replace illustrative names with approved customer logos */}
    </section>
  );
}
