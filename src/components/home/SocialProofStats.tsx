import { Container } from "@/components/ui/Container";
import {
  formatPublicStat,
  getPublicPlatformStats,
} from "@/lib/server/public-stats";
import { getTranslations } from "next-intl/server";

export async function SocialProofStats() {
  const t = await getTranslations("socialProof");
  const { domainsAudited, citationsTracked } = await getPublicPlatformStats();

  const items = [
    {
      value: formatPublicStat(domainsAudited),
      label: t("domainsAudited"),
    },
    {
      value: formatPublicStat(citationsTracked),
      label: t("citationsTracked"),
    },
    { value: "8", label: t("platformsMonitored") },
  ] as const;

  return (
    <section
      className="border-b border-border bg-background py-10 dark:bg-card md:py-12"
      aria-labelledby="social-proof-heading"
    >
      <Container>
        <h2 id="social-proof-heading" className="sr-only">
          {t("heading")}
        </h2>
        <ul className="flex flex-col divide-y divide-border md:flex-row md:items-center md:divide-x md:divide-y-0">
          {items.map((stat) => (
            <li
              key={stat.label}
              className="flex flex-1 flex-col items-center px-6 py-6 first:pt-0 last:pb-0 md:py-0"
            >
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
