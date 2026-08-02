import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { freeTools } from "@/lib/marketing/free-tools";

export function FreeToolsSection({
  variant = "light",
}: {
  variant?: "light" | "dark";
}) {
  const dark = variant === "dark";

  return (
    <section
      className={
        dark
          ? "border-t border-white/[0.06] py-16 md:py-20"
          : "border-t border-border/80 bg-cream py-14 dark:bg-background md:py-16"
      }
      aria-labelledby="free-tools-heading"
    >
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p
            className={`text-sm font-semibold uppercase tracking-wider ${
              dark ? "text-glow" : "text-accent"
            }`}
          >
            Free tools
          </p>
          <h2
            id="free-tools-heading"
            className={`font-display mt-2 text-2xl font-bold md:text-3xl ${
              dark ? "text-white" : "text-ink"
            }`}
          >
            See where you stand in AI search
          </h2>
          <p
            className={`mt-3 text-sm md:text-base ${
              dark ? "text-white/55" : "text-muted"
            }`}
          >
            GEO is new — most teams don&apos;t know their citation gap yet. Start
            with a free check, then upgrade when you need monitoring.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-3">
          {freeTools.map((tool) => (
            <Link
              key={tool.path}
              href={tool.path}
              className={`group flex flex-col rounded-2xl border p-6 transition hover:-translate-y-0.5 ${
                tool.featured
                  ? dark
                    ? "border-accent/40 bg-gradient-to-b from-accent/15 to-white/[0.04] shadow-[0_0_40px_rgba(14,165,233,0.08)]"
                    : "border-accent/30 bg-white shadow-lg shadow-accent/10"
                  : dark
                    ? "border-white/10 bg-white/[0.04] hover:border-white/20"
                    : "border-border bg-white hover:border-accent/30 hover:shadow-md"
              }`}
            >
              <span
                className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  tool.featured
                    ? "bg-accent/20 text-glow"
                    : dark
                      ? "bg-white/10 text-white/50"
                      : "bg-cream text-muted"
                }`}
              >
                {tool.badge}
              </span>
              <h3
                className={`font-display mt-4 text-lg font-bold ${
                  dark ? "text-white" : "text-ink"
                }`}
              >
                {tool.title}
              </h3>
              <p
                className={`mt-2 flex-1 text-sm leading-relaxed ${
                  dark ? "text-white/60" : "text-muted"
                }`}
              >
                {tool.description}
              </p>
              <span
                className={`mt-5 text-sm font-semibold ${
                  dark
                    ? "text-glow group-hover:text-white"
                    : "text-accent group-hover:text-accent-deep"
                }`}
              >
                Try it free →
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
