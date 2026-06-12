import { testimonials } from "@/lib/testimonials";
import { PLATFORMS } from "@/lib/dashboard";

const featuredQuote = testimonials.find((t) => t.verified) ?? testimonials[0]!;

const monitorPlatforms = PLATFORMS.slice(0, 5);

export function HeroSocialProof() {
  return (
    <div className="mx-auto mt-6 max-w-2xl sm:mt-8">
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
        Monitors citations across
      </p>
      <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-medium text-white/55 sm:gap-x-5 sm:text-sm">
        {monitorPlatforms.map((name) => (
          <li key={name} className="flex items-center gap-1.5">
            <span
              className="h-1 w-1 rounded-full bg-glow/80"
              aria-hidden
            />
            {name}
          </li>
        ))}
      </ul>

      <figure className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 text-left backdrop-blur-sm sm:px-5 sm:py-4">
        <blockquote className="text-sm leading-relaxed text-white/75 sm:text-[0.9375rem]">
          &ldquo;{featuredQuote.text}&rdquo;
        </blockquote>
        <figcaption className="mt-2.5 flex items-center gap-2.5 text-xs text-white/45">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20 font-display text-xs font-bold text-glow">
            {featuredQuote.author.charAt(0)}
          </span>
          <span>
            <span className="font-medium text-white/70">{featuredQuote.author}</span>
            {" · "}
            {featuredQuote.role}
          </span>
        </figcaption>
      </figure>

      <p className="mt-3 text-center text-[11px] text-white/35 sm:text-xs">
        From Pilot &amp; Fleet teams in private beta — not paid endorsements
      </p>
    </div>
  );
}
