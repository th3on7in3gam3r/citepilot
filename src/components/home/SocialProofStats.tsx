import { Container } from "@/components/ui/Container";

// TODO: replace with live counts from the database (workspaces, audits, action plans).
const stats = [
  { value: "500+", label: "domains audited" },
  { value: "8", label: "AI platforms monitored" },
  { value: "1,200+", label: "weekly action plans generated" },
  { value: "50+", label: "teams on Pilot & Fleet" },
] as const;

export function SocialProofStats() {
  return (
    <section
      className="border-b border-border bg-white py-10 md:py-12"
      aria-label="Platform stats"
    >
      <Container>
        <ul className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-6">
          {stats.map((stat) => (
            <li key={stat.label} className="text-center">
              <p className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1.5 text-sm text-muted">{stat.label}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
