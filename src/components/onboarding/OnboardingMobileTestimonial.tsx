import { TestimonialAvatar } from "@/components/ui/TestimonialAvatar";
import { testimonials } from "@/lib/data/testimonials";

/** Single static testimonial for mobile — no carousel. */
export function OnboardingMobileTestimonial() {
  const review = testimonials[0]!;

  return (
    <aside
      className="mt-10 rounded-2xl border border-border bg-surface p-6 lg:hidden"
      aria-label="Customer testimonial"
    >
      <div className="flex gap-0.5 text-amber-400" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink/90">
        &ldquo;{review.text}&rdquo;
      </p>
      <footer className="mt-4 flex items-center gap-3 border-t border-border/60 pt-4">
        <TestimonialAvatar author={review.author} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{review.author}</p>
          <p className="truncate text-xs text-muted">{review.role}</p>
        </div>
      </footer>
    </aside>
  );
}
