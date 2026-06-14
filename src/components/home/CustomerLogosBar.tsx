import { Container } from "@/components/ui/Container";

/**
 * TODO: Replace placeholder slots with approved customer logos (SVG/grayscale).
 * Add logos to /public/images/customers/ and map them here once permissions are confirmed.
 */
export function CustomerLogosBar() {
  const placeholders = ["Company A", "Company B", "Company C", "Company D"];

  return (
    <section
      className="border-b border-border bg-cream py-8 md:py-10"
      aria-label="Teams using CitePilot"
    >
      <Container>
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          Used by teams at
        </p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 md:gap-x-14">
          {placeholders.map((name) => (
            <li
              key={name}
              className="rounded-lg border border-dashed border-border/80 px-6 py-2.5 text-sm font-semibold text-muted/50"
            >
              {name}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
