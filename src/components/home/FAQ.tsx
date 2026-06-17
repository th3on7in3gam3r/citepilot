import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getTranslations } from "next-intl/server";

export async function FAQ() {
  const t = await getTranslations("faq");
  const items = t.raw("items") as Array<{ q: string; a: string }>;

  return (
    <Section id="faq" className="bg-background" ariaLabelledBy="faq-heading">
      <SectionHeading
        id="faq-heading"
        eyebrow={t("eyebrow")}
        title={t("title")}
        align="center"
      />
      <dl className="mx-auto mt-14 max-w-2xl space-y-5 md:mt-16">
        {items.map((item) => (
          <div
            key={item.q}
            className="rounded-2xl border border-border bg-cream p-6 dark:border-[#222] dark:bg-card md:p-8"
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
