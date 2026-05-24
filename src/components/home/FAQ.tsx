import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { faq } from "@/lib/content";

export function FAQ() {
  return (
    <Section id="faq" className="bg-white">
      <SectionHeading
        eyebrow="FAQ"
        title="Questions teams ask before switching"
        align="center"
      />
      <dl className="mx-auto mt-14 max-w-2xl space-y-5 md:mt-16">
        {faq.map((item) => (
          <div
            key={item.q}
            className="rounded-2xl border border-border bg-cream p-6 md:p-8"
          >
            <dt className="font-display text-lg font-bold text-ink md:text-xl">
              {item.q}
            </dt>
            <dd className="mt-4 text-sm leading-relaxed text-muted md:text-base">
              {item.a}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
