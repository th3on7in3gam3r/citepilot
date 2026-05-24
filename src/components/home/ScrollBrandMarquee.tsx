"use client";

import { useMemo, useRef } from "react";
import { Container } from "@/components/ui/Container";
import { scrollBrands } from "@/lib/brands";
import { useScrollSection } from "@/hooks/useScrollSection";

/** Icon width + horizontal gap between brands */
const ITEM_STEP = 168;

export function ScrollBrandMarquee() {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useScrollSection(sectionRef);

  const brandCount = scrollBrands.length;
  const activeIndex = Math.min(
    brandCount - 1,
    Math.max(0, Math.round(progress * (brandCount - 1))),
  );
  const active = scrollBrands[activeIndex];

  const trackOffset = useMemo(
    () => activeIndex * ITEM_STEP,
    [activeIndex],
  );

  return (
    <section
      ref={sectionRef}
      className="relative bg-white"
      style={{ height: "125vh" }}
      aria-label="Platforms and ecosystems"
    >
      <div className="sticky top-16 border-y border-border bg-white">
        <Container className="flex flex-col items-center py-16 md:py-20 lg:py-24">
          <p className="mb-10 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted md:mb-12">
            Scroll to explore platforms &amp; ecosystems
          </p>

          <div className="relative w-full overflow-hidden px-2 py-8 md:py-10">
            <div
              className="pointer-events-none absolute inset-y-4 left-1/2 z-10 w-32 -translate-x-1/2 rounded-3xl bg-gradient-to-r from-transparent via-accent/10 to-transparent md:w-40"
              aria-hidden
            />

            <div
              className="flex items-end gap-12 transition-transform duration-500 ease-out will-change-transform md:gap-16"
              style={{
                transform: `translateX(calc(50% - ${ITEM_STEP / 2}px - ${trackOffset}px))`,
              }}
            >
              {scrollBrands.map((brand) => {
                const isActive = brand.id === active.id;
                return (
                  <div
                    key={brand.id}
                    className={`flex w-[7.5rem] shrink-0 flex-col items-center transition-all duration-500 md:w-[8.5rem] ${
                      isActive ? "scale-105 opacity-100" : "scale-95 opacity-45"
                    }`}
                  >
                    <div
                      className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl border-2 text-lg font-bold shadow-sm transition-colors duration-500 md:h-20 md:w-20 md:text-xl"
                      style={{
                        borderColor: isActive
                          ? brand.color
                          : "var(--color-border)",
                        backgroundColor: isActive
                          ? `${brand.color}18`
                          : "white",
                        color: isActive ? brand.color : "var(--color-muted)",
                      }}
                    >
                      {brand.short}
                    </div>
                    <span
                      className={`mt-3 text-center text-xs font-semibold md:text-sm ${
                        isActive ? "text-ink" : "text-muted"
                      }`}
                    >
                      {brand.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-12 w-full text-center md:mt-16">
            <p
              key={active.id}
              className="font-display text-2xl font-bold leading-tight text-ink md:text-4xl lg:text-[2.75rem]"
              style={{ animation: "brand-swap 0.4s ease-out" }}
            >
              Get cited on{" "}
              <span style={{ color: active.color }}>{active.name}</span>
            </p>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-2 md:mt-10">
            {scrollBrands.map((b, i) => (
              <span
                key={b.id}
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: i === activeIndex ? 28 : 8,
                  backgroundColor:
                    i === activeIndex ? b.color : "var(--color-border)",
                }}
                aria-hidden
              />
            ))}
          </div>
        </Container>
      </div>
    </section>
  );
}
