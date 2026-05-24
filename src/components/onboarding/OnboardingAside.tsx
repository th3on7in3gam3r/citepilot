import Image from "next/image";
import { Logo } from "@/components/ui/Logo";
import { OnboardingTestimonialScroll } from "@/components/onboarding/OnboardingTestimonialScroll";

const dotGridStyle = {
  backgroundImage:
    "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.08) 1px, transparent 0)",
  backgroundSize: "40px 40px",
};

export function OnboardingAside() {
  return (
    <aside className="hero-cinematic relative hidden min-h-[100dvh] overflow-hidden rounded-l-[2rem] border-l border-white/10 text-white lg:m-4 lg:ml-0 lg:flex lg:flex-1 lg:flex-col">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        aria-hidden
        style={dotGridStyle}
      />
      <div
        className="pointer-events-none absolute -right-20 top-1/4 h-64 w-64 rounded-full bg-accent/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-1/4 left-1/4 h-48 w-48 rounded-full bg-glow/15 blur-3xl"
        aria-hidden
      />

      {/* World map */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center p-10"
        aria-hidden
      >
        <div className="relative h-[min(72%,520px)] w-full max-w-2xl opacity-[0.14]">
          <Image
            src="/images/onboarding/world-map.png"
            alt=""
            fill
            className="object-contain invert"
            sizes="(min-width: 1024px) 50vw, 0px"
            loading="lazy"
          />
        </div>
      </div>

      <OnboardingTestimonialScroll variant="dark" />

      <div className="absolute bottom-10 right-10 z-20 sm:bottom-12 sm:right-12">
        <div className="glass rounded-2xl px-5 py-3.5">
          <Logo light className="text-[15px]" />
        </div>
      </div>
    </aside>
  );
}
