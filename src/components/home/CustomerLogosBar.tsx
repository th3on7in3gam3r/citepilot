import { Container } from "@/components/ui/Container";

// TODO: Replace with real customer logos once permission granted
const PLACEHOLDER_LOGO_COUNT = 5;

export function CustomerLogosBar() {
  return (
    <section
      className="border-b border-border bg-cream py-8 md:py-10"
      aria-label="Trusted by teams using CitePilot"
    >
      <Container>
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          Trusted by teams at
        </p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-8 md:mt-8 md:gap-10">
          {Array.from({ length: PLACEHOLDER_LOGO_COUNT }).map((_, i) => (
            <li key={i} aria-hidden>
              <span
                className="block h-8 w-24 rounded bg-ink/10 grayscale filter md:w-28"
                title="Customer logo placeholder"
              />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
