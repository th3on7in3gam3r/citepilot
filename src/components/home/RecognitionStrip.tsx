import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { getRecognitionItems } from "@/lib/data/recognition";
import { getTranslations } from "next-intl/server";

export async function RecognitionStrip() {
  const t = await getTranslations("recognition");
  const items = getRecognitionItems();

  if (items.length === 0) return null;

  return (
    <section
      className="border-b border-border bg-surface/60 py-8 dark:bg-card/40 md:py-10"
      aria-labelledby="recognition-heading"
    >
      <Container>
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h2
              id="recognition-heading"
              className="text-xs font-semibold uppercase tracking-[0.18em] text-muted"
            >
              {t("heading")}
            </h2>
            <p className="mt-1.5 max-w-md text-sm text-muted dark:text-white/55">
              {t("subhead")}
            </p>
          </div>
          <ul className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
            {items.map((item) => {
              const className =
                "inline-flex items-center rounded-full border border-border bg-background px-3.5 py-1.5 text-sm font-medium text-foreground/85 transition hover:border-accent/40 hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:border-white/15 dark:bg-white/[0.04] dark:text-white/80 dark:hover:border-accent/40 dark:hover:text-glow";
              if (item.external || item.href.startsWith("mailto:")) {
                return (
                  <li key={item.id}>
                    <a
                      href={item.href}
                      className={className}
                      {...(item.href.startsWith("http")
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      {item.kind === "product_hunt"
                        ? t("productHunt")
                        : item.kind === "press"
                          ? t("pressKit")
                          : item.kind === "listing_cta"
                            ? t("directoryListings")
                            : item.label}
                    </a>
                  </li>
                );
              }
              return (
                <li key={item.id}>
                  <Link href={item.href} className={className}>
                    {item.kind === "press" ? t("pressKit") : item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </Container>
    </section>
  );
}
