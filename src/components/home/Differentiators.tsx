import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { differentiators } from "@/lib/content";

export function Differentiators() {
  return (
    <Section className="bg-background" ariaLabelledBy="differentiators-heading">
      <SectionHeading
        id="differentiators-heading"
        eyebrow="Why CitePilot"
        title="Monitor. Fix. Prove. — not monitor-only."
        align="center"
      />
      <div className="mx-auto mt-14 max-w-3xl overflow-hidden rounded-2xl border border-border bg-white shadow-sm dark:border-[#222] dark:bg-card dark:shadow-black/20 md:mt-16">
        <div className="grid grid-cols-2 bg-ink text-xs font-semibold uppercase tracking-wider text-white/60">
          <div className="border-r border-white/10 px-6 py-5 md:px-8">Typical GEO tool</div>
          <div className="px-6 py-5 md:px-8 text-glow">CitePilot</div>
        </div>
        {differentiators.map((row, i) => (
          <div
            key={row.them}
            className={`grid grid-cols-2 text-sm md:text-base ${
              i % 2 === 0 ? "bg-surface dark:bg-[#141414]" : "bg-white dark:bg-card"
            }`}
          >
            <div className="border-r border-border px-6 py-5 text-muted md:px-8 md:py-6">
              {row.them}
            </div>
            <div className="px-6 py-5 font-medium text-ink md:px-8 md:py-6">
              {row.us}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
